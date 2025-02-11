import { generateTokenAndSetCookie } from "../lib/utils/genetateToken.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
export const signup=async(req,res)=>{
    
    try{
        const {fullName, userName, email, password}=req.body;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
        
            return res.status(400).json({error:'Invalid Email format'});
        }
        const existingUser=await User.findOne({userName});
        if(existingUser)
        {
            return res.status(400).json({error:'Username already taken'});
        }
        const existingEmail=await User.findOne({email});
        if(existingEmail)
        {
            return res.status(400).json({error:'Enail already taken'});
        }
        if(password.length<6)
        {
            return res.status(400).json({error:'Password must be atleast 6 characters'});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const newUser=new User({
            fullName:fullName,
            userName:userName,
            email:email,
            password:hashedPassword

        })

        if(newUser)
        {
            generateTokenAndSetCookie(newUser._id,res);
            await newUser.save();
            res.status(201).json({
                _id:newUser._id,
                fullName: newUser.fullName,
                userName: newUser.userName,
                email:newUser.email,
                followers:newUser.followers,
                following:newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
            })
        }
        else{
            res.status(400).json({error:'Invalid User Data'});
        }
    }
    catch(error)
    {
        res.status(500).json({error:'Internal Server Error'});
        console.error(error);
        
    }
};

export const login=async(req,res)=>{
    try{
        const {userName,password}=req.body;
        const user=await User.findOne({userName});
        const isPasswordCorrect=await bcrypt.compare(password,user.password);

        if(!user || !isPasswordCorrect)
        {
            return res.status(400).json({error:'Invalid credientials'});
        }
        generateTokenAndSetCookie(user._id,res);
        
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            userName:user.userName,
            email:user.email,
            followers:user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        })
        console.log('Login Successfull',userName);
    }catch(error)
    {
        console.log('Error in login controller:',error.message);
        res.status(500).json({error:'Internal Server Error'});
    }
};

export const logout=async(req,res)=>{
    try{
        res.cookie('jwt','',{maxAge:0});
        res.status(200).json({message:'Logged Out Successfully'});
    }catch(error)
    {
        console.log('Error in Logout Controller:',error.message);
        res.status(500).json({error:'Internal Server Error'});
    }
};

export const getMe=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id).select('-password');
        return res.status(200).json(user);
    }
    catch(error)
    {
        console.log('Error in getMe Controller:',error.message);
        res.status(500).json({error:'Internal Server Error'});
    }
}