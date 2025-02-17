import mongoose from "mongoose";
import { DB_NAME } from "../constants.js ";

// here we are using async await because database connection takes time.
// database is in another continent(just a fancy line)
const connectDB = async ()=>{
    try {
        const connectioInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(connectioInstance)
        // here connectionInstance holds the response that we are getting after connection.

        console.log(`\n MongoDB connected! DB HOST: ${connectioInstance.connection.host}`)
        // above line is used only to ensure whether I'm connected to right database.
    } catch (error) {
        console.error("mongoDB CONNECTION failed: ", error)
        // our current applicaion must be running on a process
        // this process is a reference of that process
        // node has different exit codes like 1,2.. etc
        process.exit(1)

    }
}


export default connectDB;

