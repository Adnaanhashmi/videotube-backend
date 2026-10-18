import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import vidoeRouter from "./routes/video.routes.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN
})) 
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser())
app.use("/api/v1/user",userRouter)
app.use("/api/v1/watch",vidoeRouter)
export default app