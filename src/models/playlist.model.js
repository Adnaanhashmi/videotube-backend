import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    description: {
        typeof: String,
        max: 30
    },
    videos: [
        {
        typeof: mongoose.Schema.Types.ObjectId,
        ref: "Video"
        }
    ],
    owner: {
        typeof: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
{ timestamps: true })

playlistSchema.plugin(mongooseAggregatePaginate)

export const Playlist = mongoose.model("Playlist", playlistSchema)