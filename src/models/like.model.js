import mongoose from "mongoose";

const likeSchema =  new mongoose.Schema({
 comment: {
    typeof: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
 },
 video: {
    typeof: mongoose.Schema.Types.ObjectId,
    ref: "Video"
 },
 likedBy: {
    typeof: mongoose.Schema.Types.ObjectId,
    ref: "User"
 },
 tweet: {
    typeof: mongoose.Schema.Types.ObjectId,
    ref: "Tweet"
 }
},
{ timestamps: true })

export const Like = mongoose.model("Like",likeSchema)