import { asyncWrapper } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"
import Errorstandards from "../utils/errorsStandards.js";
import upload from "../middlewares/multer.middleware.js";
import cloudinaryService, { cloudinary } from "../services/cloudinary.services.js";
import Apiresponse from "../utils/apiResponse.js";
import mongoose, { Collection } from "mongoose";
import { extractPublicId } from "cloudinary-build-url";

const videoUpload = asyncWrapper(async(req,res) => {
 const {title, description} = req.body

 if (!(title && description)) {
        throw new Errorstandards(400,"Title is required");
    }
  
 const videoLocalPath = req.files?.video[0]?.path
 const thumbnailLocalPath = req.files?.thumbnail[0]?.path

 if(!videoLocalPath) {
        throw new Errorstandards(500,"Video is unable to meet server");
    }
 if(!thumbnailLocalPath){
        throw new Errorstandards(500,"Pleasem upload the thumbnail first")
 }
 const video = await cloudinaryService(videoLocalPath)
 const thumbnail = await cloudinaryService(thumbnailLocalPath)

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
  
 const publishedVideo = Video.findById(publishVideo._id).populate("owner")

 if (!publishedVideo) {
    throw new Errorstandards(500,"video failed to upload");
 }

 res
 .status(200)
 .json(
   new Apiresponse(
      "Video is uploaded successfully",
      createdVideo,
      200,
      1
   )
 )
})

const getVideo = asyncWrapper(async(req,res) => {
 const videoId = req.params?.videoId
 const video = await Video.findById(videoId)

 if (!video) {
      throw new Errorstandards(400,"video doesnot exist")
   }

 if(!video.ispublished && video.owner.toString() !== req.user?._id.toString()){
   throw new Errorstandards(400,"Video is private");
 }
   
 res.status(100).json(
      new Apiresponse(
         "Video is sent",
         video,
         100,
         1
      )
   )
})


const updateDetails = asyncWrapper(async(req,res) => {
 const userId = req.user?._id
 const videoId = req.params?.videoId
 const {title, description} = req.body
 const newThumbnail = req.file?.thumbnail[0]?.path
 
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

 video.title = title || video.title
 video.description = description || video.description
 await video.save({validateBeforeSave: false})

 const oldVideoThumbnail = video.thumbnail
 let newThumbnailUrl;

 if(newThumbnail){
   const uploadNewThumbnail = await cloudinaryService(newThumbnail)

   if(!uploadNewThumbnail.url){
      throw new Errorstandards(500,"failed to upload image");
   }

   newThumbnailUrl = uploadNewThumbnail.url
   const oldThumbnailPublicId = extractPublicId(oldVideoThumbnail)
   
   if(!oldThumbnailPublicId){
      console.log("Old thumbnail is failed to delete");
   }else{
   await cloudinary.uploader.destroy(oldThumbnailPublicId)
   }
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
})

const deleteVideo = asyncWrapper(async(req,res) => {
 const userId = req.user._id
 const videoId = req.params?.videoId

 const video = await Video.findById(videoId)

 if (!video) {
   throw new Errorstandards(400,"Video does not exist");
 }
 if (video.owner.toString() !== userId.toString()) {
   throw new Errorstandards(400,"You must be the owner to delete the video");
 }

 const thumbnailPublicId = extractPublicId(video.thumbnail)
 const videoPublicId = extractPublicId(video.videofile)

 if (!(thumbnailPublicId && videoPublicId)) {
   throw new Errorstandards(500,"video or thumbnail public id is invalid");
 }

 await cloudinary.api.delete_resources([videoPublicId,thumbnailPublicId])

 const deleteVideoInDatabase = await Video.findByIdAndDelete(video._id)

 if(!deleteVideoInDatabase){
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

 const video = await Video.findById(videoId)

 if(!video){
   throw new Errorstandards(404,"video does not exist")
 }

 if (video.owner.toString() !== req.user?._id.toString()) {
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