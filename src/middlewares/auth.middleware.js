import jwt from "jsonwebtoken"
import { asyncWrapper } from "../utils/asynchandler.js";
import Errorstandards from "../utils/errorsStandards.js";
import { User } from "../models/user.model.js";

export const VerifyJWT = asyncWrapper(
   async(req,_,next) => {
try {
     const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "")     
     if (!token) {
        throw new Errorstandards(400,"tokens doesn't exists");
     }
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
     )
     
     if (!user) {
        throw new Errorstandards(401,"invalid access token")
     }
     req.user = user;
     next()
}
catch (error) {
    throw new Errorstandards(401,"Tokens are invalid", error);
    
}
}
)