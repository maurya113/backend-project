import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req, res) =>{
    // get user details from frontend
    // valid the fields(whether the fields are empty)
    // check if user already exists
    // check for images, check for avatar
    // upload the images to cloudinary
    // check if it is uploaded on cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation(whether user is created)
    // return response
    const {fullname, email, username, password}  = req.body 
    console.log("email", email);

    if (
        [fullname, email, username, password].some((field)=> field?.trim() === "")
        // instead of checking each field when can check all together like this
    ) {
        throw new ApiError(400, "All fields are required")
    }    

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
        // $or is an operator that checks whehter this "username" or "email" already exist
    })
    console.log(`username or email already exist ${existedUser}`)

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // if req.files exist then access the avatar(declared in routes) and access it's first property that gives an object which provides access to path.
    // we got the access of req.files by multer
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar files is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar files is required")
    }

    // database is always in a different continent
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,   
        username: username.toLowerCase() 
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        // whatever we don't want we write inside the string
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})

export {registerUser}

// Let’s walk through the flow when a request hits {/register"::

// The route handler registerUser is wrapped by asyncHandler.
// When registerUser runs:
// If no error occurs, it responds with a success message.
// If an error occurs (throw new Error("Username is required")):
// The promise is rejected.
// .catch() inside asyncHandler catches the error and passes it to next(err).
// The global error handler picks it up and sends a 500 response.
