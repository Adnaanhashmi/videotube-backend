
import 'dotenv/config';
import connectdatabase from './DB/index.js';
import app from './app.js';

connectdatabase().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App is listening at port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log(`Database could not be connected`, error); 
})


//  THIS COMMENTED CODE SHOWS HOW TO CONENCT DB IN MAIN FILE BUT IT IS NOT PROFESSTIONAL APPROACH;

// import 'dotenv/config'
// import mongoose from "mongoose"
// import { DB_NAME } from "./constants.js"
// import express from "express"
// const app = express()

// ;(async () => {
//     try {
//         await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`)
//         console.log('Database connected');
        
//         app.on("error",(error) => {
//             console.log("express app is not able to talk to database",error);
//             throw error
//         })
//         app.listen(process.env.PORT,() => {
//             console.log(`App is listening at port ${process.env.PORT}`);
//         }) 
//     } catch (error) {
//         console.log("Connection to server is failed sir !!", error);
//         throw error
//     }
// })();


