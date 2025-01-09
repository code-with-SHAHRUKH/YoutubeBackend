import { Router } from "express";
import { 
  
    registerUser, 

} from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

//router.route("/register").post( registerUser) //or jese hi user api/v1/user k baad /register per aae ga to registerUser will call
//now injecting middleware(upload) in above route to accept file
router.route("/register").post(upload.fields(
    //that can accept 2 different types of files
    [{
    
        name: "avatar",// front end me bhi name same rhe ga
        maxCount: 1// hum abhi sir 1 image le ge
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }]
), registerUser)



export default router