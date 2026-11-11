import { asyncWrapper } from "../utils/asynchandler.js";
import Apiresponse from "../utils/apiResponse.js";
import Errorstandards from "../utils/errorsStandards.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import cleanString from "../utils/inputValidator.js";
import { isObjectIdOrHexString } from "mongoose";

const createTweet = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {content} = req.body
    const filteredContent = cleanString(content)

    if (!userId) {
        throw new Errorstandards(401,"You must be logged in to tweet");
    }
    if (!filteredContent) {
        throw new Errorstandards(400,"Content is invalid");
    }
    if (filteredContent.length > 70) {
        throw new Errorstandards(400,"Content length can't exceed over 70 characters");
    }

    const tweet = await Tweet.create({
        owner: userId,
        filteredContent
    })

    const tweetedOrNot = await Tweet.findById(tweet._id)

    if (!tweetedOrNot) {
        throw new Errorstandards(500,"Tweet failed to upload please try again");
    }

    res.status(200).json(
        new Apiresponse(
            "Tweet is uploaded",
            tweet,
            200
        )
    )
})

const getUserTweets = asyncWrapper(async(req,res) => {
    const {username} = req.params

    if (!username.trim()) {
        throw new Errorstandards(400,"Can't retrieve username");
    }

    const user = await User.findOne({username})

    if (!user) {
        throw new Errorstandards(404,"User not found");   
    }

    const userTweets = await Tweet.find({owner: user._id})

    if (!userTweets.length) {
        throw new Errorstandards(200,"User has no tweet");
    }

    res.status(200).json(
        new Apiresponse(
            "All tweets of this user",
            userTweets,
            200
        )
    )
})

const updateTweet = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {tweetId,content} = req.params
    const filteredContent = cleanString(content)

    if (!userId) {
        throw new Errorstandards(400,"You must logged in to update tweets");
    }
    if (!filteredContent) {
        throw new Errorstandards(400,"Content is invalid");
    }
    if (!tweetId) {
        throw new Errorstandards(400,"Can't retrieve tweet id");
    }
    if (!isObjectIdOrHexString(tweetId)) {
        throw new Errorstandards(400,"Tweet id is invalid");   
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new Errorstandards(404,"Tweet doesn't exist");
    }

    const isOwner = userId.toString() === tweet.owner.toString() ? true : false

    if (!isOwner) {
        throw new Errorstandards(403,"You must be owner to edit or update tweet");
    }

    tweet.content = filteredContent
    await tweet.save({validateBeforeSave: false})

    res.status(200).json(
        new Apiresponse(
            "Tweet is updated successfully",
            tweet,
            200
        )
    )
})

const deleteTweet = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {tweetId} = req.params

    if (!userId) {
        throw new Errorstandards(400,"YOu must logged in before deleting tweet");
    }
    if (!tweetId) {
        throw new Errorstandards(400,"Can't retrieve tweet id");
    }
    if (!isObjectIdOrHexString(tweetId)) {
        throw new Errorstandards(400,"Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new Errorstandards(404,"tweet does not exist")
    }

    const isOwner = userId.toString() === tweet.owner.toString() ? true : false

    if(!isOwner){
        throw new Errorstandards(403,"You must be owner to this tweet");
    }

    const eraseTweet = await Tweet.findByIdAndDelete({_id: tweet._id})

    if (!eraseTweet) {
        throw new Errorstandards(500,"failed to delete tweet");
    }

    res.status(200).json(
        new Apiresponse(
            "Tweet is deleted successfully",
            eraseTweet,
            200
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}