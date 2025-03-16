import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //fs stands for file system, provided by node itself
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" 
        })
        // after this the file is uploaded
        // console.log("file is uploaded on Cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        console.log(response)
        return response 
    
    } catch (error) {
        fs.unlinkSync(localFilePath) // removes the locally saved temporary file
        // when the upload operation got failed
        // unlinkSync ensures that it is a mandatory work without this we won't proceed further.
        console.error("cloudinary upload failed: ", error)
        return null;
    }
}

const deleteFromClodinary = async (publicId) => {
    try{
        if(!publicId){
            throw new ApiError(400, "public id is required while deleting the image from cloud")
        }

        const response = await cloudinary.uploader.destroy(publicId)
        console.log("clodinary's avatar image delete response: ", response)

        return response

    }catch(error){
        console.log("error while deleting the file from cloudinary")
        return null;
    }
}

// multer first saves the file in the public directory and then uploader.upload method of 
// cloudinary is used to store the file on cloudinary 
// and in case the file is not uploaded on the cloudinary then it is removed from the public
// directory using - "fs.unlinkSync()" method.
// this is a synchronous method that ensures that the unlink is not done in background
// it should be done right now and without that we won't proceed futher.


export {uploadOnCloudinary, deleteFromClodinary}


// const uploadResult = await cloudinary.uploader
//   .upload(
//     "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//     {
//       public_id: "shoes",
//     }
//   )
//   .catch((error) => {
//     console.log(error);
//   });
