import { asyncWrapper } from "../utils/asynchandler.js";
import Errorstandards from "../utils/errorsStandards.js";
import Apiresponse from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js"
import mongoose from "mongoose";
import { isObjectIdOrHexString } from "mongoose";
import cleanString from "../utils/inputValidator.js";

const createPlaylist = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {videoId} = req.params
    const {name,description} = req.body

    if (!userId) {
        throw new Errorstandards(400,"You must loggedIn to create a playlist")
    }
    if (!videoId) {
        throw new Errorstandards(400,"Can't retrieve video Id to save in playlist");
    }
    if (!isObjectIdOrHexString(videoId)) {
        throw new Errorstandards(400,"invalid video id");  
    }
    if (!name) {
        throw new Errorstandards(400,"You can't create playlist without name");
        
    }

    const videoExistOrNot = await Video.findById(videoId)

    if (!videoExistOrNot) {
        throw new Errorstandards(404,"Video does not exists");
    }

    const playlistName = cleanString(name)
    const playlistDescription = cleanString(description)

    if (playlistName) {
        throw new Errorstandards(400,"Please enter valid name");   
    }

    const playlist = await Playlist.create({
        name,
        description: playlistDescription ?? "",
        videos: videoExistOrNot._id,
        owner: userId
    })

    const playlistCreatedOrNot = await Playlist.findById(playlist._id)

    if (!playlistCreatedOrNot) {
        throw new Errorstandards(500,"Playlist failed to create");
    }

    res.status(200).json(
        new Apiresponse(
            "Playlist is createed successfully",
            playlist,
            200
        )
    )
})

const getUserPlaylist = asyncWrapper(async(req,res) => {
     const {username} = req.params
     const user = await User.findOne({username}).select("-password -refreshToken")

    if (!user) {
        throw new Errorstandards(404,"User does't exists")
    }

    const playlists = Playlist.aggregate([
        {
            $match: {
                owner: user._id
            }
        },
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
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                totalVideos: {
                    $size: "$videos"
                }
            }
        }
    ])

    if (!playlists) {
        throw new Errorstandards(404,"there is no playlist made by this user");
    }

    res.status(200).json(
        new Apiresponse(
            "Playlists of this user",
            playlists[0],
            200
        )
    )
})

const getPlaylistById = asyncWrapper(async(req,res) => {
    const {playlistId} = req.params

    if (!playlistId.trim()) {
        throw new Errorstandards(400,"Can't retrieve playlist id");
    }
    if (!isObjectIdOrHexString(playlistId)) {
        throw new Errorstandards(400,"invalid playlist id");
        
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
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
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                ]
            }
        }
    ])

    if (!playlist.length) {
        throw new Errorstandards(404,"There is no playlist");
    }

    res.status(200).json(
        new Apiresponse(
            "Playlist is sent",
            playlist[0],
            200
        )
    )
})

const addVideoToPlaylist = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {videoId,playlistId} = req.params

    if (!userId) {
        throw new Errorstandards(400,"You must logged in to add video in playlist");
    }
    if (!videoId) {
        throw new Errorstandards(400,"can't retrieve video id");
    }
    if (!isObjectIdOrHexString(videoId)) {
        throw new Errorstandards(400,"invalid video id");
    }
    if (!playlistId) {
        throw new Errorstandards(400,"Can't retrieve playlist id");
    }
    if(!isObjectIdOrHexString(playlistId)){
        throw new Errorstandards(400,"invalid video id");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new Errorstandards(404,"video does not exists");
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Errorstandards(404,"Playlist does not exists");
    }

    const isOwner = userId.toString() === playlist.owner.toString() ? true : false

    if (!isOwner) {
        throw new Errorstandards(400,"You must be owner to add video in this playlist");
    }

    playlist.videos.push(videoId)
    await playlist.save({validateBeforeSave: false})

    res.status(200).json(
        new Apiresponse(
            "Video is added to playlist",
            playlist,
            200
        )
    )
})

const deletePlaylist = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {playlistId} = req.params

    if (!userId) {
        throw new Errorstandards(400,"You must logged in before deleting playlist")
    }
    if (!playlistId) {
        throw new Errorstandards(400,"Can't retrieve playlist id");
    }
    if (!isObjectIdOrHexString(playlistId)) {
        throw new Errorstandards(400,"Can't delete the playlist because the playlist id is invalid");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Errorstandards(404,"Playlist not found");
    }

    const isOwner = userId.toString() === playlist.owner.toString() ? true : false

    if (!isOwner) {
        throw new Errorstandards(400,"You must be owner for deleting this playlist");
    }

    const deletePlaylist = await Playlist.deleteOne({_id: playlist._id})

    if (deletePlaylist.deletedCount !== 1) {
        throw new Errorstandards(500,"Playlist is failed to delete");
    }

    res.status(200).json(
        new Apiresponse(
            "Playlist is deleted successfully",
            deletePlaylist,
            200
        )
    )
})

const deleteVideoFromPlaylist = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {playlistId,videoId} = req.params
    
    if (!userId) {
        throw new Errorstandards(400,"You must be logged in to delete video from playlist");
    }
    if (!(playlistId && videoId)) {
        throw new Errorstandards(400,"Please provide both PlaylistID and VideoID");
    }
    if (!isObjectIdOrHexString(playlistId)) {
        throw new Errorstandards(400,"PlaylistId is invalid so you can't delete video from this playlist");      
    }
    if (!isObjectIdOrHexString(videoId)) {
        throw new Errorstandards(400,"VideoId is invalid so you can't remove video from playlist");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Errorstandards(404,"Playlist doesn't exist");   
    }

    const isOwner = userId.toString() === playlist.owner.toString() ? true : false

    if(!isOwner){
        throw new Errorstandards(403,"You must be owner of this playlist to delete this video");
    }

    const videoIndexValue = playlist.videos.findIndex((id) => id.toString() === videoId)

    if (videoIndexValue === -1) {
        throw new Errorstandards(400,"Video doesn't exist in playlist");
    }

    playlist.videos.splice(videoIndexValue,1)
    await playlist.save({validateBeforeSave: false})    

    res.status(200).json(
        new Apiresponse(
            "Video is removed from the playlist",
            playlist,
            200
        )
    )
})

const updatePlaylist = asyncWrapper(async(req,res) => {
    const {playlistId} = req.params
    const {name,description} = req.body
    const userId = req.user._id

    if (!playlistId) {
        throw new Errorstandards(400,"Can't retrieve playlist id")
    }
    if (!(name || description)) {
        throw new Errorstandards(400,"Provide atleast name or description to update");   
    }
    if (!isObjectIdOrHexString(playlistId)) {
        throw new Errorstandards(400,"Playlist id is not valid");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Errorstandards(404,"Playlist not found")
    }

    const isOwner = userId.toString() === playlist.owner.toString() ? true : false

    if (!isOwner) {
        throw new Errorstandards(403,"You must be owner to edit this playlist");
    }

    const playlistName = cleanString(name)
    const playlistDescription = cleanString(description)

    playlist.name = playlistName ?? playlist.name;
    playlist.description = playlistDescription ?? playlist.description
    await playlist.save({validateBeforeSave: false})

    res.status(200).json(
        new Apiresponse(
            "Playlist details is updated",
            playlist,
            200
        )
    )
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    deletePlaylist,
    deleteVideoFromPlaylist,
    updatePlaylist
}

