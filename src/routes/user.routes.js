import { Router } from "express";
import { 
  
    registerUser, 

} from "../controllers/user.controller.js";


const router = Router()

router.route("/register").post( registerUser) //or jese hi user api/v1/user k baad /register per aae ga to registerUser will call



export default router