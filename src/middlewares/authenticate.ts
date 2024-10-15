import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from 'jsonwebtoken'
import { config } from "../config/config";

export interface Authrequest extends Request{
    userId: string
}

const authenticate = (req:Request, res:Response, next:NextFunction)=>{
    const token = req.header('Authorization')

    if(!token){
        return next(createHttpError(401, 'Autherization token is required'))
    }

    try {
        const pasrsedToken = token.split(' ')[1];

        const decoded = jwt.verify(pasrsedToken, config.jswtSecret as string)
        
        const _req = req as Authrequest

        _req.userId = decoded.sub as string

        next()

    } catch (error) {
        return next(createHttpError(401, 'Token Expire'))
    }
    
}

export default authenticate