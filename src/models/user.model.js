import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true,"Username is required"],
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true,"Email is required"],
    unique: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: [true,"Full name is required"]
  },
  avatar:{
    type: String, // Using Cloudinary for images
    required: true
  },
  coverimage:{
    type: String
  },
  password:{
    type: String,
    required: true,
  },
  watchHistory:[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }
  ],
  refreshToken:{
    type: String
  }
}
,{timestamps: true});

userSchema.pre("save", async function() {
    if (!this.isModified('password')) return null;
    try {
        this.password = await bcrypt.hash(this.password, 10);
    }
    catch (error) {
        throw new Error(error);   
    }
});
userSchema.methods.passwordValidate = async function (password){
    return bcrypt.compare(password,this.password)
}
userSchema.methods.AccessToken = function(){
   return jwt.sign(
    {
        _id: this._id,
        username: this.username,
        fullname: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
   )
}
userSchema.methods.RefreshToken = function(){
   return jwt.sign(
    {
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
   )
}

export const User = mongoose.model('User',userSchema)