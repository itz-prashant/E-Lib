import { HttpError } from 'http-errors';
import { config } from '../config/config';
import { NextFunction, Request } from 'express';


const globalErrorHandler = (err: HttpError, req: Request, res: any, next: NextFunction)=>{
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        message: err.message,
        errorStack: config.env === 'development' ? err.stack : ''
    })
}

export default globalErrorHandler;