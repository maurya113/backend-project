// As early as possible in your application, import and configure dotenv:
// require('dotenv').config({path: './env'})
import dotenv from "dotenv"

 
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})


connectDB()

// following is a way to connect our app to database.
/*
import express from "express"

const app = express()
// following approach is called IIFE - immediately invoked function expression.
;( async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // following event listener is for error in case our database is connected successfully
        // but still our server is not able to communcate to it.
        app.on("error", (error)=>{
            console.log("ERROR:->" , error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.error(`ERROR: ${error}`)
        throw error
    }
})()
*/