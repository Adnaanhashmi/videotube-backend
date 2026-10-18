import { Router } from "express";
import { changePassword, currentUser, getUserProfileChannel, getWatchHistory, loginUser, logoutUser, refreshAcressToken, registerUser, updateAvatarImage, updateCoverImage, updateUserDetails } from "../controller/user.controller.js";
import upload from "../middlewares/multer.middleware.js"
import { VerifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
      {
        name: "avatar",
        maxCount: 1
      },{
        name: "coverimage",
        maxCount: 1
      }
    ]),
    registerUser)
    
    //secure routes
router.route("/login").post(loginUser)
router.route("/logout").post(VerifyJWT, logoutUser)
router.route("/refresh-Token").post(refreshAcressToken)
router.route("/change-password").patch(VerifyJWT, changePassword)
router.route("/user-details").get(VerifyJWT, currentUser)
router.route("/updateaccountdetails").patch(VerifyJWT, updateUserDetails)
router.route("/updateavatar").patch(VerifyJWT, upload.single("avatar"), updateAvatarImage)
router.route("/updatecoverimage").patch(VerifyJWT, upload.single("coverimage"), updateCoverImage)
router.route("/history").get(VerifyJWT, getWatchHistory)
router.route("/c/:username").get(VerifyJWT, getUserProfileChannel)

export default router