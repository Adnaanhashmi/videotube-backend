import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        required: true,
        min: 1,
        max: [70,"maximum limit is 70 characters"]
    }
},
{timestamps: true})

export const Tweet = mongoose.model("Tweet",tweetSchema)