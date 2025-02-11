import express from 'express';
import authRoutes from './routes/auth.routes.js'
const app=express();
import dotenv from 'dotenv';
import connectMongoDB from './db/connectMongoDB.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const PORT=process.env.PORT || 8000
console.log(process.env.MONGO_URI);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use('/api/auth',authRoutes);


app.listen(8000,()=>{
    
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})  