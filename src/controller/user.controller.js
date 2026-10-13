import { asyncWrapper } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import Errorstandards from "../utils/errorsStandards.js";
import upload from "../middlewares/multer.middleware.js";
import cloudinaryService from "../services/cloudinary.services.js";
import { cloudinary } from "../services/cloudinary.services.js";
import { extractPublicId } from "cloudinary-build-url";
import Apiresponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { application } from "express";

const generateAccessAndRefreshToken = async(userId) => {
try {
    const user = await User.findById(userId)
    const UserAccessToken =  user.AccessToken()
    const UserRefreshToken = user.RefreshToken()
  
    user.refreshToken = UserRefreshToken
    user.save({ validateBeforeSave : false})
    return {UserAccessToken,UserRefreshToken}
} catch (error) {
  throw new Errorstandards(500,"Couldn't create Tokens");
}}

const registerUser = asyncWrapper(async(req,res) => {
  //get details from user comes from frontend { i am using postman }
  //applying validators for proper data
  //case handling if user is already exist
  //getting avator and coverimage from user using multer also appling checks that is on server
  //uploading on cloudinary and retriving url
  //create user
  //check user is created or not if created return respose without password and refreshaToken
  const {fullName,email,password,username} = req.body

   if ([fullName, email, password, username].some((field) => field.trim() === "")) {
    throw new Errorstandards(400, "Data field is empty");
  }
  
   const userExistence = await User.findOne({
    $or: [{username},{email}]
   })
   if (userExistence) {
    throw new Errorstandards(401,"User Already exists")
  }
  // console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverimageLocalPath = req.files?.coverimage[0]?.path
  
  if (!avatarLocalPath) {
    throw new Errorstandards(500,"Image is failed to meet on server ");
  }
  const avatarOnCloudinary = await cloudinaryService(avatarLocalPath)
  const coverimageOnCloudinary = await cloudinaryService(coverimageLocalPath)
  // console.log(avatarOnCloudinary);
   
  const userCreation = await User.create({
    fullName,
    username,
    email,
    password,
    avatar: avatarOnCloudinary.url,
    coverimage: coverimageOnCloudinary.url ?? ""
  })
  
  console.log(userCreation);
  

  const user = await User.findById(userCreation._id).select(
    "-password -refreshToken"
  )
  // console.log(user);
  
  if (!user) {
    throw new Errorstandards(500,"user is failed to create account")
  }
  return res.status(201).json(
    new Apiresponse("User Account is created successfully",user,200)
  )
})

const loginUser = asyncWrapper(async(req,res) => {
    const {email,username,password} = req.body
  
  if (!(username || email)) {
      throw new Errorstandards(400,"username or email is required");
    }

  const user = await User.findOne({
      $or: [{ username }, { email }],
    })
   
  if (!user) {
     throw new Errorstandards(400,"User does'not exist");
   }

  const passwordValidate = await user.passwordValidate(password)

  if (!passwordValidate) {
    throw new Errorstandards(410,"Password is incorrect");
   }
   
  const {UserAccessToken, UserRefreshToken} = await generateAccessAndRefreshToken(user._id)

  // console.log(UserAccessToken);
  

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  const options = {
    httpOnly: true,
    secure: true
  }
  
  res
  .status(200)
  .cookie("AccessToken", UserAccessToken, options)
  .cookie("RefreshToken", UserRefreshToken, options)
  .json(
    new Apiresponse(
        "User is loggedin successfully",
        {
          loggedinUser,
          UserAccessToken,
          UserRefreshToken
        },
        200
    )
  )
})

const logoutUser = asyncWrapper(async(req,res) => {
  const userDetails = req.user?._id
  const user = await User.findById(userDetails).select(
    "-password"
  )
  user.refreshToken = undefined
  user.save({ validateBeforeSave : false});

 const options = {
    httpOnly: true,
    secure: true
  }
  res
  .status(200)
  .clearCookie("AccessToken", options)
  .clearCookie("RefreshToken", options) 
  .json(
    new Apiresponse(
      "Logout successfully",
      {},
      200
    )
  ) 
})

const refreshAcressToken = asyncWrapper(async(req,res) => {
  try {
    const refreshToken = req.cookies?.RefreshToken || req.body?.RefreshToken
    if (!refreshToken) {
      throw new Errorstandards(401,"Un-Authorized Token");
    }
    const decodedTokenValue = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decodedTokenValue._id).select(
      "-password -refreshToken"
    )
  
    if (!user) {
      throw new Errorstandards(401,"User doesn't exists");
    
    if(refreshToken !== user?.refreshToken) 
     throw new Errorstandards(401,"Un-Authorized Token");
    }
    const {UserAccessToken,UserRefreshToken} = await generateAccessAndRefreshToken(user._id)
  
    const options = {
     httpOnly: true,
     secure: true
    }
  
    res
    .status(200)
    .cookie("AccessToken", UserAccessToken, options)
    .cookie("RefreshToken", UserRefreshToken, options)
    .json(
      new Apiresponse(
        "Access Token is refreshed successfully",
        {
          UserAccessToken, UserRefreshToken
        },
        200
      )
    )
  } catch (error) {
    throw new Errorstandards(401,"Un-Authorized Token");
  }
})

const changePassword = asyncWrapper(async(req,res) => {
  const {oldPassword, newPassword, confirmPasssword} = req.body
   
  if (!(oldPassword && 'newPassword' && confirmPasssword)) {
    throw new Errorstandards(400,"fill the required field");
  }

  if (!(newPassword === confirmPasssword)) {
    throw new Errorstandards(400, "Confirm password does'not match");
  }
  const user = await User.findById(req.user?._id).select("-password -refreshToken")

  const passwordValidationCheck = user.passwordValidate(oldPassword)

  if (!passwordValidationCheck) {
    throw new Errorstandards(400,"Password is incorrect");
    
  }
  
  if (!user) {
    throw new Errorstandards(401,"Invalid Credentials")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})
  return res
  .status(200)
  .json(
    new Apiresponse("Password is changed successfully", user, 200)
  )
})

const currentUser = asyncWrapper(async(req,res) => {
  const userId = req.user?._id

  const userExistence = User.findById(userId).select("-password -refreshToken")

  if (!userExistence) {
    throw new Errorstandards(400, "User doesnot exist");
  }

  return res
  .status(200)
  .json(
    new Apiresponse("Current User", res.user, 201)
  )
})

const updateUserDetails = asyncWrapper(async(req,res) => {
  const {newfullName, newEmail} = req.body
  const userId = req.user?._id

  if (!(newfullName || newEmail)) {
    throw new Errorstandards(400,"fullname or email is needed for update");
  }
  const user = await User.findById(userId).select("-password -refreshToken")

   if (!user) {
    throw new Errorstandards(401,"Invalid Credentials")
  }

  user.fullName = newfullName ?? user.fullName
  user.email = newEmail ?? user.email
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new Apiresponse("Details is updated", user, 200)
  )
})

const updateAvatarImage = asyncWrapper(async(req,res) => {
  const userId = req.user._id
  const avatarLocalPath = req.file?.path
  
  const user = await User.findById(userId).select("-password -refreshToken")

  if (!user) {
    throw new Errorstandards(404,"User does not exist");
  }

  if (!avatarLocalPath) {
    throw new Errorstandards(500,"Avatar Image failed to meet server"); 
  }

  const avatar = await cloudinaryService(avatarLocalPath)
  const oldAvatarUrl = user.avatar

  if (!avatar.url) {
    throw new Errorstandards(500, "Image failed to upload");
  }

  user.avatar = avatar.url
  await user.save({validateBeforeSave: false})

  const avatarPublicId = extractPublicId(oldAvatarUrl)
  
  if (!avatarPublicId) {
    throw new Errorstandards(400,"avatar public id is not available")
  }

  const deleteOldAvatar = await cloudinary.uploader.destroy(avatarPublicId).catch((err) => {
    console.log("Image is failed to delete",err);
  })

  res
  .status(200)
  .json(
    new Apiresponse("Avatar is updated successfully",{avatar: avatar.url},200)
  )
})

const updateCoverImage = asyncWrapper(async(req,res) => {
  const userId = req.user._id 
  const coverimageLocalPath = req.file?.path

  const user = await User.findById(userId).select("-password -refreshToken")

  if(!user){
    throw new Errorstandards(404,"User does not exist");
  }

  if (!coverimageLocalPath) {
    throw new Errorstandards(500,"Avatar Image failed to meet server"); 
  }

  const updatedCoverImage = await cloudinaryService(coverimageLocalPath)
  const oldCoverImage = user.coverimage

  if (!updatedCoverImage.url) {
    throw new Errorstandards(501, "Image failed to upload");
  }

  user.coverimage = updatedCoverImage.url
  await user.save({validateBeforeSave: false})

  const coverImagePublicId = extractPublicId(oldCoverImage)

  if (!coverImagePublicId) {
    throw new Errorstandards(400,"Cover Image public id is not available"); 
  }
  await cloudinary.uploader.destroy(coverImagePublicId).catch((err) => {
    console.log("cover image is failed to delete");
  })

  res
  .status(200).
  json(
    new Apiresponse("Cover Image is Successfully updated",{coverimage: updateCoverImage.url},200)
  )
})

const getUserProfileChannel = asyncWrapper(async(req,res) => {
  const{ username } = req.params
  
  if (!username?.trim()) {
    throw new Errorstandards(400, "User doesn't exists");
  }

  const channelDetails = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      },
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberedTo"
      }
    },
    {
      $addFields: {
        totalsubscribers : {
          $size: "$subscribers"
        },
        subscribedto: {
          $size: "$subscriberedTo"
        }
      },
        issubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "subscribers"]
            },
            then: true,
            else: false
          }
        }
    },
    {
      $project: {
        username: 1,
        totalsubscribers: 1,
        subscribedto: 1,
        issubscribed: 1
      }
    }
  ])
  if (!channelDetails.length) {
    throw new Errorstandards(404,"Page does not exists");
  }

  return res
  .status(200)
  .json(
    new Apiresponse('Profile page is loaded successfully',channelDetails[0],200)
  )
})

const getWatchHistory = asyncWrapper(async(req,res) => {
  const userId = req.user._id

  const userExistOrNot = await User.findById(userId).select("-password -refreshToken")

  if (!userExistOrNot) {
    throw new Errorstandards(404,"User does not exist");
    
  }
  const userHistory = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchhistory",
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
                      avatar: 1,
                      coverimage: 1,
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
    if (!userHistory) {
      throw new Errorstandards("Failed to fetched watch history");
    }
    return res
    .status(200)
    .json(
      new Apiresponse("Watch history fateched successfully",userHistory[0].watchHistory,200)
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcressToken,
  changePassword,
  currentUser,
  updateUserDetails,
  updateAvatarImage,
  updateCoverImage,
  getUserProfileChannel,
  getWatchHistory
}