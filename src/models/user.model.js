import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// token is a piece of data that is used for authenication and authorization in web applications
// jwt is a bearer token(whoever has the token will get the data)

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, // trim removes the un-neccessasary spaces from the string
        index: true // if you want any field to be searchable then set "index: true"
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,  // cloudinary url
        required: true,
    }, 
    coverImage:{
        type: String
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String, // password must be encrypted
        required: [true, "password is required"]
    },
    refreshToken:{
        type: String
    }
},{timestamps: true})

userSchema.pre("save", async function(next){
    // mongoose automatically provides next fn. as argument. 
    // we are not using arrow fn. because we need the currenct context "this"
    if(!this.isModified("password")) return next(); // password refers to password field as in this.isModified, this is already written
    else{
    this.password = await bcrypt.hash(this.password, 10) // this.password refers to current value of password
    next()
    }
    // if conditions checks that only if there is a modification in password field
    // then only encrypt the password.
    
    // next is called to end the execution and call the next middleware
})

userSchema.methods.isPasswordcorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

// generate access and refresh token

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)