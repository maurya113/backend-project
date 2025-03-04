// As early as possible in your application, import and configure dotenv:
// require('dotenv').config({path: './env'})
import dotenv from "dotenv"

import express from 'express'
import connectDB from "./db/index.js";
import { app } from "./app.js";



dotenv.config({
    path: './.env'
})

// connectDB() is an async method whenever an async method gets completed
// it returns a promise so we can use .then() and .catch()
connectDB()
.then(()=>{
    app.on("error", (err)=>{
        console.log(err)
    })

    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`server listening on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(`MongoDB connection failed: ${err}`)
})

// follwing is the code for database connection

// ;(async () => {
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
//        app.on("error", (error)=>{
//         console.log("ERROR: ", error)
//         throw error
//        })

//        app.listen(process.env.PORT, ()=>{
//         console.log(`app is listening on port: ${process.env.PORT}`)
//        })
//     } catch (error) {
//         console.error(error)
//         throw error;
//     }
// })()