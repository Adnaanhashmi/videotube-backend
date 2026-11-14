import { asyncWrapper } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"
import Errorstandards from "../utils/errorsStandards.js";
import upload from "../middlewares/multer.middleware.js";
import cloudinaryService, { cloudinary } from "../services/cloudinary.services.js";
import Apiresponse from "../utils/apiResponse.js";
import mongoose, { Collection } from "mongoose";
import { extractPublicId } from "cloudinary-build-url";
import { isObjectIdOrHexString } from "mongoose";

const videoUpload = asyncWrapper(async(req,res) => {
 const {title, description} = req.body

 if (!(title && description)) {
        throw new Errorstandards(400,"Title and description is required");
    }
  
 const videoLocalPath = req.files?.video[0]?.path
 const thumbnailLocalPath = req.files?.thumbnail[0]?.path

 if(!videoLocalPath) {
        throw new Errorstandards(500,"Video is unable to reach server");
    }

 if(!thumbnailLocalPath){
        throw new Errorstandards(500,"Thumbnail is unable to reach server")
 }
 const video = await cloudinaryService(videoLocalPath)
 const thumbnail = await cloudinaryService(thumbnailLocalPath)

 if (!video?.url) {
    throw new Errorstandards(500,"video failed to upload on cloudinary");
 }

 if (!thumbnail?.url) {
    throw new Errorstandards(500,"Thumbnail is failed to upload")
 }

 const publishVideo = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    duration: video.metadata?.duration,
    isPublished: true,
    owner: req.user._id,
    views: 0
 })
  
 const publishedVideo = await Video.findById(publishVideo._id).populate("owner","username fullName avatar")

 if (!publishedVideo) {
    throw new Errorstandards(500,"video failed to upload");
 }

 res
 .status(200)
 .json(
   new Apiresponse(
      "Video is uploaded successfully",
      publishedVideo,
      200
   )
 )
})

const getVideo = asyncWrapper(async(req,res) => {
 const videoId = req.params?.videoId

 if (!isObjectIdOrHexString(videoId)) {
  throw new Errorstandards(400," can't get video because video id is invalid")
 }

 const video = await Video.findById(videoId).populate("owner","fullName username avatar coverimage")

 if (!video) {
      throw new Errorstandards(400,"video doesn't exist")
   }

 const isOwner = req.user?._id.toString() === video.owner?._id.toString() ? true : false
 
 if (!(isOwner || video.isPublished)) {
   throw new Errorstandards(400,"Video is private")
 }

 if(!isOwner){
   await Video.updateOne({_id: videoId},{$inc : {views : 1}})
 }

 res.status(200).json(
      new Apiresponse(
         "Video is sent",
         video,
         200
      )
   )
})


const updateDetails = asyncWrapper(async(req,res) => {
 const userId = req.user?._id
 const videoId = req.params?.videoId
 const {title, description} = req.body
 const newThumbnail = req.file?.thumbnail[0]?.path

 if (!isObjectIdOrHexString(videoId)) {
    throw new Errorstandards(400,"can't update details because video id is invalid");
 }
 
 const video = await Video.findById(videoId)

 if (!video) {
      throw new Errorstandards(400,"Video Doesn't exist");
 }

 if(userId.toString() !== video.owner.toString()){
      throw new Errorstandards(400,"Only owner is able to edit this video");
 }

 if (!(title || description)) {
      throw new Errorstandards(400,"Please provide Title or Description")
   }

 video.title = title ?? video.title
 video.description = description ?? video.description

 const oldVideoThumbnail = video.thumbnail
 let newThumbnailUrl;

 if(newThumbnail){
   const uploadNewThumbnail = await cloudinaryService(newThumbnail)

   if(!uploadNewThumbnail?.url){
      throw new Errorstandards(500,"failed to upload thumbnail");
   }
   newThumbnailUrl = uploadNewThumbnail.url
}

 video.thumbnail = newThumbnailUrl ?? video.thumbnail
 await video.save({validateBeforeSave: false})

 res
 .status(200)
 .json(
   new Apiresponse(
      "Details is updated successfully"
      ,video
      ,200)
 )

  const oldThumbnailPublicId = extractPublicId(oldVideoThumbnail)

  await cloudinary.uploader.destory(oldThumbnailPublicId).catch(() => {
    console.log("Old video thumbnail is failed to delete")
  })
})

const deleteVideo = asyncWrapper(async(req,res) => {
 const userId = req.user._id
 const videoId = req.params?.videoId

 if (!isObjectIdOrHexString(videoId)) {
  throw new Errorstandards(400,"can't delete video because of invalid video id");
 }

 const video = await Video.findById(videoId)

 if (!video) {
   throw new Errorstandards(400,"Video does not exist");
 }
 if (video.owner.toString() !== userId.toString()) {
   throw new Errorstandards(400,"You must be the owner to delete the video");
 }

 const thumbnailPublicId = extractPublicId(video.thumbnail)
 const videoPublicId = extractPublicId(video.videofile)

 await cloudinary.api.delete_resources([videoPublicId,thumbnailPublicId]).catch((error) => {
  throw new Errorstandards(500,"video is failed to delete",error);
 })

 const deleteVideoInDatabase = await Video.deleteOne({_id: videoId})

 if(deleteVideoInDatabase.deletedCount !== 1){
   throw new Errorstandards(500,"Video is failed to delete")
 }
 
 res
 .status(200)
 .json(
   new Apiresponse("Video is deleted successfully")
 )
})

const togglePublishStatus = asyncWrapper(async(req,res) => {
 const videoId = req.params?.videoId

 if (!isObjectIdOrHexString(videoId)) {
  throw new Errorstandards(400,"You can't decide publish status because video id is invalid");
 }

 const video = await Video.findById(videoId).populate("owner","username fullName avatar")

 if(!video){
   throw new Errorstandards(404,"video does not exist")
 }

 if (video.owner?._id.toString() !== req.user?._id.toString()) {
   throw new Errorstandards(400,"Only owner is able to change the publish status");
 }
 
 video.ispublished = !video.ispublished
 await video.save({validateBeforeSave: false})

 res
 .status(200)
 .json(
   new Apiresponse(
      "Video's publish status is changed successfully",
      video,
      200
   )
 )
})

const getAllVideos = asyncWrapper(async(req,res) => {
 const {page,limit} = req.query

 if (!(Number(page) && Number(limit))) {
  throw new Errorstandards(400,"Page number or limit is invalid");
 }
 
 const customlabels = {
  totalDocs: "totalVideos",
  docs: "Videos"
 }
 
 const options = {
   page: Number(page) || 1,
   limit: Number(limit) <= 10 ? Number(limit) : 10,
   customLabels: customlabels
 }

 const videosPipeline = Video.aggregate([
  {
    $match:{
      isPublished: true
    }
  },
  {
    $sort: {
      createdAt: -1
    }
  },
  "__PREPAGINATE__",
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            fullName: 1,
            username: 1,
            avatar: 1
          }
        }
      ]
    }
  },
  {
    $addFields: {
      owner: {
        $first: "$owner"
      }
    }
  }

 ])

 const videos = await Video.aggregatePaginate(videosPipeline,options)
 
 if (!videos.Videos.length) {
    throw new Errorstandards(404,"No one uploaded video yet")
 }
 
 res.status(200).json(
  new Apiresponse(
    "10 videos loaded first",
    videos,
    200
  )
 )
})

const getAllChannelVideos = asyncWrapper(async(req,res) => {
  const {username} = req.params
  const {page,limit} = req.query

  if (!username.trim()) {
    throw new Errorstandards(400,"Can't retrieve username")
  }
  if (!(Number(page) && Number(limit))) {
    throw new Errorstandards(400,"Invalid page and limit")
  }

  const user = await User.findOne({username})

  if (!user) {
    throw new Errorstandards(404,"user doesn't exist");
  }

  const customlabels = {
    totalDocs: "totalVideos",
    docs: "Videos",
 }

  const options = {
    page: Number(page) || 1,
    limit: Number(limit) <= 10 ? Number(limit) : 10,
    customLabels: customlabels
  }

  const userVideosPipeline = Video.aggregate([
    {
      $match: {
        owner: user._id,
        isPublished: true
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    "__PREPAGINATE__",
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: {
          $first: "$owner"
        }
      }
    }
  ])

  const userVideos = await Video.aggregatePaginate(userVideosPipeline,options)

  if (!userVideos.Videos.length) {
    throw new Errorstandards(404,"User have not uploaded any video");
  }

  res.status(200).json(
    new Apiresponse(
      "User's all video sent",
      userVideos,
      200
    )
  )
})

export {
  videoUpload,
  getVideo,
  updateDetails,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
  getAllChannelVideos
}