import express from 'express'
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// cors is used for security purpose so that any other browser or front-end 
// won't be able to make a request on our server
app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
// all the static files are stored in public folder
app.use(cookieParser())
// cookieParser is used to access the cookies of user and 
// perform CRUD operation on cookies

export {app}