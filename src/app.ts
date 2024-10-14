import express, { NextFunction, Request, Response } from 'express'
import globalErrorHandler from './middlewares/globalErrorHandler'
import userRouter from './user/userRouter'

const app = express()

app.use(express.json())

app.get('/', (req: Request, res: Response, next:NextFunction) => {
    res.json({message: "Welcome to elib apis"})
})

app.use('/api/users',userRouter)

app.use(globalErrorHandler)

export default app;