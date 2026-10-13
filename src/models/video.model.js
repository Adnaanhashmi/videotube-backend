import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videofile:{
        type: String, // Using Cloudinary
        required: true,
    },
    thumbnail:{
        type: String, // Using Cloudinary
        required: true,
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    duration:{
        type: Number, // duration is also provided by Cloudinary
        required: true,
    },
    views:{
        type: Number,
        default: 0
    },
    ispublished:{
        type: Boolean
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
},{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video",videoSchema)