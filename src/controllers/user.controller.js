import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFromClodinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while creating access or refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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
  const { fullname, email, username, password } = req.body;
  // console.log(req.body);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
    // instead of checking each field when can check all together like this
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
    // $or is an operator that checks whehter this "username" or "email" already exist
  });
  console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // if req.files exist then access the avatar(declared in routes) and access it's first property that gives an object which provides access to path.
  // we got the access of req.files by multer

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar files is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar files is required");
  }

  // database is always in a different continent
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
    // select all the user data, just don't select "password" and "refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
    // this is for server side error
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from req.body
  // username or email
  // find the user
  // password check
  // access and refresh token generation
  // send tokens with cookie

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError("username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
    // or is mongoDB operator
  });

  if (!user) {
    throw new ApiError("this user doesn't exist");
  }

  const isPasswordValid = await user.isPasswordcorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password incorrect");
  }
  /*If isPasswordValid is true, !isPasswordValid becomes false, so the if block does not execute (no error is thrown).
    If isPasswordValid is false, !isPasswordValid becomes true, so the if block executes and throws an error.*/

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  // accesstoken and refreshtoken generation

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  // now only server can modify and access the cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User logged In successfully "
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // find the user
  // remove all the cookies
  // remove refreshToken or reset refreshToken

  // in the logout route before going on the controller we have used a middleware that sets the req.user = user and verify the user by using it's token so now in the logoutUser controller we have the access of user.
  // this will find the user and then set it's refreshtoken to undefined
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  // this checks whether the refresh token is valid
  // if it is created using the same secret key we will get access to the payload data.
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  // decodedToken have payload data

  try {
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    // checks whether the token is same as the one which is stored in the database.
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
    // many refresh token may have been created using the same key

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
  }

  // asyncHandler will catch the error but it won't allow us to generate the custom error msg.
});

const changeCurrentPassword = asyncHandler(async(req, res)=>{
  const {oldPassword, newPassword} = req.body
   
  const user = req.user  //if got any error check this line
  const isPasswordCorrect = await user.isPasswordcorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res)=> {
  const {fullname, email} = req.body

  if(!fullname || !email){
    throw new ApiError(400, "all fields are required")
  }

 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      fullname: fullname,
      email: email
    }
  },
  {new: true}

).select("-password")

return res
.status(200)
.json(new ApiResponse(200, {user}, "account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatarLocalPath = req.file?.path
  // don't need to specify name because only one file is getting uploaded

  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is missing")
  } 

  const user1 = await User.findById(req.user?._id)
  if(user1.avatar){
    const publicId = user1.avatar.split('/').pop().split('.')[0];
    await deleteFromClodinary(publicId)
  } // this is used to delete from cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, {user}, "avatar updated successfully"))

})


const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path
  // don't need to specify name because only one file is getting uploaded

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image file is missing")
  } 

  const user1 = await User.findById(req.user?._id)
  if(user1.coverImage){
    const publicId = user1.coverImage.split('/').pop().split('.')[0]
    await deleteFromClodinary(publicId)
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading on cover image")
  }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, {user}, "cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params //we are extracting the username from URL

  if(!username?.trim()){ //trim() makes sure that username is not just empty spacess
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase() //user model ke pass jo username hai usko match karo is username se jo hamko mil rha hai url ke through
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel", // channel holds the objectId(the id of the user)
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size: "$subscribers"
        },
        channelsSubscirbedToCount:{
          $size: "subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id, "$subscribers.$subscriber"]},
            // this checks that - jo user currently login hai uska i'd subscribers ke list mei hai ya nahi hai.
            then: true,
            else: false
          }
        }  
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscirbedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "user channel fetched successfully")
  )
})

export { 
  registerUser,
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser, 
  updateAccountDetails,
  updateUserAvatar, 
  updateUserCoverImage,
  getUserChannelProfile
};

// Let’s walk through the flow when a request hits {/register"::

// The route handler registerUser is wrapped by asyncHandler.
// When registerUser runs:
// If no error occurs, it responds with a success message.
// If an error occurs (throw new Error("Username is required")):
// The promise is rejected.
// .catch() inside asyncHandler catches the error and passes it to next(err).
// The global error handler picks it up and sends a 500 response.
