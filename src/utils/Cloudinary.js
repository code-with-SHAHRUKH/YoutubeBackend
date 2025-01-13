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






//code to delete the file from clodinary
/*// Function to extract public_id from the cloudinary uploaded image URL
const extractPublicId = (cloudinaryUrl) => {
  const parts = cloudinaryUrl.split("/");
  // Remove version and file extension (e.g., /v1627657324/ and .jpg)
  const versionIndex = parts.findIndex((part) => part.startsWith("v"));
  const publicIdParts = parts.slice(versionIndex + 1).join("/").split(".");
  return publicIdParts[0];
};

// Delete old image using public_id from URL
const deleteOldImage = async (imageUrl) => {
  try {
    const publicId = extractPublicId(imageUrl);
    console.log("Extracted public_id:", publicId);

    const deleteResponse = await cloudinary.uploader.destroy(publicId);
    console.log("Delete Response:", deleteResponse);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

// Example usage
const oldImageUrl = "https://res.cloudinary.com/demo/image/upload/v1627657324/my_folder/my_image.jpg";
deleteOldImage(oldImageUrl);

*/

