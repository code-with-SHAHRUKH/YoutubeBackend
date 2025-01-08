import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

//isi configuration ki waja se hi hum cloudinary ko securily use kr pa rhe he
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



// file upload hone ka kaam time consuming he or is me error bhi aaa skta he to trycatch me likho
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload any file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        }) 
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);

        fs.unlinkSync(localFilePath)// jese hi file upload ho jay to local sever se file  ko del kar do

        return response;// responce.url give us the URL of uploaded file on clodinary

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}