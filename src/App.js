import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,// some time is me hum aik array det eh jis me mibile or web k front ka URL hota he
    credentials:true
}))
app.use(express.json({limit:"16kb"}));// alow server to accept json data
app.use(express.urlencoded({extended:true,limit:"16kb"}))// alow server to accept updated url data
app.use(express.static("public")) // alow server to accept static files
app.use(cookieParser())// se detail from notes
export default app