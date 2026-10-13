import mongoose from "mongoose";
import {DB_NAME} from '../constants.js';


const connectdatabase = async function(){
    try {
    const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`)
        console.log(`Database is connected successfully`)
    } catch (error) {
        console.log("Oops database connection is failed",error);
        process.exit(1)
    }
}
export default connectdatabase

