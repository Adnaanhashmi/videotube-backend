import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";

const vidoeRouter = Router()

vidoeRouter.route("/upload").post(upload.fields([
    {
        name: "video",
        maxCount: 1,
        video_metadata: true,
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]))

// vidoeRouter.route("/:videoId").get(getVideo)

export default vidoeRouter