import { asyncWrapper } from "../utils/asynchandler.js";
import Apiresponse from "../utils/apiResponse.js";
import Errorstandards from "../utils/errorsStandards.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const subscriptionToggle = asyncWrapper(async(req,res) => {
    const userId = req.user._id
    const {username} = req.params

    if (!userId) {
        throw new Errorstandards(400,"Can't retrieve userId")
    }
    if (!username.trim()) {
        throw new Errorstandards(400,"Can't retrieve username of the channel");
    }

    const channel = await User.findOne({username})

    if(!channel){
        throw new Errorstandards(404,"channel does not found");
    }
    if (userId.toString() === channel._id.toString()) {
        throw new Errorstandards(400,"You can't subscribe yourself!");
    }

    const existingSubscription = await Subscription.findOneAndDelete({subscriber: userId, channel: channel._id})

    if (existingSubscription) {
        return res.status(200).json(
            new Apiresponse(
                "Channel successfully unsubscribed",
                isSubscribed,
                200
            )
        )
    }

    const subscribe = await Subscription.create({
        subscriber: userId,
        channel: channel._id
    })
    
    const subscribedOrNot = await Subscription.findById(subscribe._id)

    if (!subscribedOrNot) {
        throw new Errorstandards(500,"Failed to subscribe channel")
    }

    res.status(200).json(
        new Apiresponse(
            "Channel subscribed successfully",
            subscribe,
            200
        )
    )
})

const channelSubscribers = asyncWrapper(async(req,res) => {
    const {username} = req.params

    if (!username.trim()) {
        throw new Errorstandards(400,"Can't retrieve username");
    }

    const channel = await User.findOne({username})

    if (!channel) {
        throw new Errorstandards(404,"Channel not found");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {   
                channel: channel._id
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
                subscriber: {
                    $first: "$subscriber"
                }
            }
        }
    ])
    
    if (!subscribers.length) {
        throw new Errorstandards(400,"There is no subscriber of this channel");
    }

    res.status(200).json(
        new Apiresponse(
            "Here are all subsribers of this channel",
            subscribers,
            200
        )
    )
})

const SubscribedChannels = asyncWrapper(async(req,res) => {
    const {username} =req.params

    if (!username.trim()) {
        throw new Errorstandards(400,"Can't retrieve username")
    }

    const subscriber = await User.findOne({username})

    if (!subscriber) {
        throw new Errorstandards(404,"User does not exist");
    }

    const subscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriber._id
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
            $addFields:{
                channel: {
                    $first: "$channel"
                }
            }
        }
    ])

    if(!subscribedTo.length){
        throw new Errorstandards(400,"This user have not subscribed to anyone")
    }

    res.status(200).json(
        new Apiresponse(
            "All subscribed channels fetched successfully",
            subscribedTo,
            200
        )
    )
})

export {
    subscriptionToggle,
    channelSubscribers,
    SubscribedChannels
}
