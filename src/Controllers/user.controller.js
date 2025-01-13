import { AsyncHandler } from "../utils/AsyncHandler.js";

import { ApiError } from "../utils/APIErrorStandarize.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/APIRespStandarize.js";


const generateAccessAndRefereshTokens = async(userId) =>{
    // mongoose k bydefaul  methods ko hum User se acces kare ge
    // jo method hum ne khud se Schema me add kiye he Unhe hum user se access kare ge
    try {
        const user = await User.findById(userId)//--> ye mongoose ka method he // db  me se user laae ge
        const accessToken = user.generateAccessToken()// ye hum ne khud se inject kiya he
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken//user data me refersh token bhej do
        //user me nahi cheez add krne k baad use save karo
        await user.save({ validateBeforeSave: false })// save krne se pehle db p/w maange ga but is object ki waja se nhi maange ga

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = AsyncHandler( 
    async (req,res,next,error) =>
     {
        /*Registeration steps*/
   // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response
    
    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;// middleware hume request k saath extra cheez file de rha he
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)//agr img upload na hui to ye hm emptystring dega

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    // hamara User model directly Database k saath connected he
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        // agr user Db me created he to is me se ye ye cheeze hata do or Client ko do
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //res.status ko hi zyada tr server accept--> res.json k ander status bhi theek hi he
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

     }
 )



 const loginUser = AsyncHandler(async (req,res)=>{
    console.log("object req",req.header);
    // req body -> data
    // username or email
    //find the user--> in DB
    //password check
    //access and referesh token--Generation
    //send cookie
    //send responce
    const {email, username, password} = req.body
    console.log("Data from front end",email,username,req.body);

    // if (!username && !email) {
    //     throw new ApiError(400, "username or email is required")
    // }
    
    // Here is an alternative of above code based on logic discussed in video:
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
        
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist please Register your self")
    }


    // Mongoose k methos User model me he--> ye by default present hote
    //or User model ne jo user bnaya he us k methods user obj me he--> ye hum ne khud se inject kiye he
    //
   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

// ab updated user ko db se fetch kare ge--> because tokens ab save hue he
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
// frontend/browser per kooklies send krne k lea hume options desighn krne perte...
    const options = {
        // in options k through hum kookies ko sirf server se modifyable bna de ge
        //nhi to koi bhi fronend se inhe modify kr skta
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        // mobile kookies accept nhi krta use responce hi samagh aae ga
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const logoutUser = AsyncHandler(async(req, res) => {

    // user ko db se find karo or refresh token nikaal do
    await User.findByIdAndUpdate(
        //req.user hum middleware ki waja se le pa rahe...
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true  // is se hume update hone k baad ki info return hoti he
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)// acces token clear means user logged Out
    .clearCookie("refreshToken", options)// refresh token clear means user k lea Acces token ab nhi generate ho ga
    .json(new ApiResponse(200, {}, "User logged Out"))
})

/*when the access token will expire then this controller will call from frontend to generate new Acces-Token*/
// this is also used fro AutoLogin the User
const refreshAccessToken = AsyncHandler(async (req, res) => {
    //token from user
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


const changeCurrentPassword = AsyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")// inuted p/w not matched with Db p/w
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = AsyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = AsyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}// update hone k baad return karo nhi to updated user ko lene k lea nai Db Call krni pare gi
        
    ).select("-password")// pasword k ilava sab kuch select kr k user variable me daal do

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = AsyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = AsyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
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
    updateUserCoverImage,};