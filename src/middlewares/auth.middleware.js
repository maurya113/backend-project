import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// this will verify whether there is an user or not
// access and refresh token are generated using JWT


// we will verify whether we have true access and refresh token then we'll add
// a user

// res is not used here hance provided _ at that place
export const verifyJWT = asyncHandler(async(req, _, next) => {
    // get the tokens from cookies
    // req and res both have access of cookies 
    // in case of mobile applications we don't have access to cookies in these cases user send a custom header.
    try{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    /* It checks the Authorization header in the request.
    If the header exists, it removes the "Bearer " prefix using .replace("Bearer ", ""), extracting just the token.
    req.header("Authorization")- Retrieves the value of the Authorization header, which could be something like -> Bearer eyJhbGciOiJIUzI1...
    replace("Bearer ", "") -> Removes the "Bearer " prefix from the string.
    The final result will be just the token */
    if(!token){
        throw new ApiError(401, "unauthorized request for token")
    }
    // check whether the token that we got from the user is correct token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    // while creating the token we provided some data like id, username etc..
    // if the token is valid, it returns the decoded payload inside decodedToken
    console.log("this is decoded token", decodedToken)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user){
        throw new ApiError(401, "invalid accessToken")
    }

    req.user = user; 
    // this creates a new object named user and inject the user that we got from this
    next()
    } catch(error){
        throw new ApiError(401, error?.message || "invalid access token")
    }
    
})


/* note:- The Authorization header is used in HTTP requests to send authentication credentials to the server.
example-> Authorization: Bearer abc123xyz
Here, "Bearer abc123xyz" is a token that a user sends to prove their identity.

 */