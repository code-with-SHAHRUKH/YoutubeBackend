
// import dotenv from 'dotenv';

// import ConnectDB from './db/index.js';
// dotenv.config({path:'./env'});
// ConnectDB()





// this is also bet way to connect backend with DB but we apply above way cus this is Modular
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
import {DB_NAME} from "./constants.js";
import express from 'express';
const app=express();

(async () =>
    {
try {
    let res=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("hi server is connected with DB on this Host:",res.connection.host);// on which host the server is conneteing with DB
    app.on("error",(error)=>{
console.log("error during connecting express",error);
throw error
    })
    app.listen(process.env.PORT,()=>{

        console.log("App is Listening on port",process.env.PORT);
    })
} catch (error) {
    console.log("Error during connection:",error);
    throw error;
}
}
)()







//this code also work 
// mongoose.connect('mongodb+srv://gulukwl123:CzJCYvENOVGNwPPe@cluster0.kbgng.mongodb.net/youtube'
//     ,{useNewUrlParser:true,
        
//       useUnifiedTopology:true
//       }).then(()=>{console.log("Connected successfully Now You are Junior Mern-stack-Developer");})
//          .catch((error)=>{console.log("Some thing is wrong");});