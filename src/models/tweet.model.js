import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
    owner: {
        typeof: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content: {
        typeof: String,
        required: true,
        min: 1,
        max: [70,"maximum limit is 70 characters"]
    }
},
{timestamps: true})

export const Tweet = mongoose.model("Tweet",tweetSchema)