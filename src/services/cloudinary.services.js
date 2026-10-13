import {v2 as cloudinary} from "cloudinary";
import fs from "fs"
import Errorstandards from "../utils/errorsStandards.js";
import { response } from "express";
import { url } from "inspector";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

const cloudinaryService = async (localStorage) => {
  try {
    if(!localStorage) return null
    //uploading image
    const uploadResult = await cloudinary.uploader.upload(localStorage,{
      resource_type: "auto"
    })
    console.log("File is uploaded successfully");
    fs.unlinkSync(localStorage)
    return uploadResult
  } catch (error) {
    fs.unlink(localStorage)
    return null
  }
}
export default cloudinaryService
export {cloudinary}