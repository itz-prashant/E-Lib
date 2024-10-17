import express, { NextFunction, Request, Response } from 'express'
import globalErrorHandler from './middlewares/globalErrorHandler'
import userRouter from './user/userRouter'
import bookRouter from './book/bookRouter'
import cors from 'cors'
import { config } from './config/config'

const app = express()

app.use(cors({
    origin: config.frontendDomain
}))

app.use(express.json())

app.get('/', (req: Request, res: Response, next:NextFunction) => {
    res.json({message: "Welcome to elib apis"})
})

app.use('/api/users',userRouter)

app.use('/api/books',bookRouter)

app.use(globalErrorHandler)

export default app;