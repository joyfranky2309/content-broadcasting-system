const express=require('express');
const bcrypt = require('bcryptjs');
const pool =require("../utils/db");
const jwt = require('jsonwebtoken');
require("dotenv").config();

const registerUser=async(req,res,next)=>{
    try {
        const {name,email,password,role}=req.body;
        if(!name || !email || !password || !role){
            return res.status(400).json({message:"All fields are required"});
        }
        const mailcheck=await pool.query("SELECT * FROM users WHERE email=$1",[email]);
        if(mailcheck.rows.length>0)
        {
            return res.status(400).json({message:"Email already exists"})
        }
    
        const passwordHash=await bcrypt.hash(password,10);
        const result=await pool.query(
            "INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING *",
            [name,email,passwordHash,role]
        )
        const {password_hash,userwithoutpassword}=result.rows[0];
        return res.status(201).json({message:"User registered sucessfully",user:userwithoutpassword})
        
    } catch (error) {
        next(error);
    }
}
const loginUser=async(req,res,next)=>{
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"});
        }
        const usercheck=await pool.query("SELECT * FROM users WHERE email=$1",[email]);
        if(usercheck.rows.length===0)
            return res.status(400).json({message:"Invalid email or password"});
        user=usercheck.rows[0];
        const isMatch=await bcrypt.compare(password,user.password_hash);
        if(!isMatch)
        {
            return res.status(400).json({message:"Invalid mail or password"});
        }
        const token=jwt.sign({userId:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:"1h"});
        return res.status(200).json({message:"Login successful",token});
    } catch (error) {
        next(error);
    }
}
module.exports={registerUser,loginUser};