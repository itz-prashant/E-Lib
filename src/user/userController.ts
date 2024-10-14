import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from 'bcrypt'
import { sign } from "jsonwebtoken";
import { config } from "../config/config";

const createUser = async(req: Request, res: Response, next: NextFunction) =>{

    const {name, email, password} = req.body;

    if(!name || !email || !password){
        const error = createHttpError(400, "All fields are required")
        return next(error)
    }

    try {
        const user = await userModel.findOne({email})

        if(user){
            const error = createHttpError(400, "User Already exist with this email")
            return next(error)
        }
    } catch (error) {
        return next(createHttpError(500, "Error while getting user"))
    }
    

    const hashPassword = await bcrypt.hash(password, 10)

    let newUser;

    try {
        newUser = await userModel.create({
            name,
            email,
            password: hashPassword
        })
    } catch (error) {
        return next(createHttpError(500, "Error while creating user"))
    }

    try {
        const token = sign({sub: newUser._id}, config.jswtSecret as string, {expiresIn:'7d'})

        res.status(201).json({accessToken: token});
        
    } catch (error) {
        return next(createHttpError(500, "Error while signing the jwt token"))
    }

}

const loginUser = async (req: Request, res: Response, next: NextFunction) =>{

    const {email, password} = req.body;

    if(!email || !password){
        const error = createHttpError(400, "All fields are required")
        return next(error)
    }

    let user;
    try {
        user = await userModel.findOne({email})

        if(!user){
            const error = createHttpError(400, "User not found")
            return next(error)
        }
    } catch (error) {
        return next(createHttpError(500, "Error while getting user"))
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        return next(createHttpError(400,"User name or password incorrect"))
    }

    try {
        const token = sign({sub: user._id}, config.jswtSecret as string, {expiresIn:'7d'})

        res.status(201).json({accessToken: token});
        
    } catch (error) {
        return next(createHttpError(500, "Error while signing the jwt token"))
    }

}

export {createUser, loginUser}; 