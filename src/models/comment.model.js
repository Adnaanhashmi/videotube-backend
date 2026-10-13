import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
 content: {
    typeof: String,
    required: true,
    max: 100
 },
 video: {
    typeof: mongoose.Schema.Types.ObjectId,
    ref: "Video"
 },
 owner: {
    typeof: mongoose.Schema.Types.ObjectId,
    ref: "User"
 }
},
{ timestamps: true })

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment",commentSchema)