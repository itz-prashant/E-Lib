import express, { NextFunction, Request, Response } from 'express'
import globalErrorHandler from './middlewares/globalErrorHandler'

const app = express()

app.get('/', (req: Request, res: Response, next:NextFunction) => {
    res.json({message: "Welcome to elib apis"})
})

app.use(globalErrorHandler)

export default app;