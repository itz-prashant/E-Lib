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
    const user = await userModel.findOne({email})

    if(user){
        const error = createHttpError(400, "User Already exist with this email")
        return next(error)
    }

    const hashPassword = await bcrypt.hash(password, 10)

    const newUser = await userModel.create({
        name,
        email,
        password: hashPassword
    })

    const token = sign({sub: newUser._id}, config.jswtSecret as string, {expiresIn:'7d'})

    res.json({accessToken: token})
}

export {createUser}; 