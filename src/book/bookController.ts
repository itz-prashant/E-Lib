import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from 'node:fs'

const createBook = async (req: Request, res: Response, next: NextFunction) =>{
    console.log('files', req.files);

    const {title, genre} = req.body

    const files = req.files as{[fieldname: string]: Express.Multer.File[]}

    const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1)

    const filename = files.coverImage[0].filename

    const filePath = path.resolve(__dirname, '../../public/data/uploads', filename)

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: filename,
            folder: 'book-covers',
            format: coverImageMimeType,
        })
    
        const bookFileName = files.file[0].filename;
    
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName)
    
        const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath , {
            resource_type: 'raw',
            filename_override: bookFileName,
            folder: 'book-pdfs',
            format: "pdf"
        })
    
        console.log("bookFileUploadResult", bookFileUploadResult);
    
        console.log('uploadResult', uploadResult);

        const newBook = await bookModel.create({
            title,
            genre,
            author: '670d0e7b00f86ae8943d37d2',
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })

        try {
            await fs.promises.unlink(filePath)
            await fs.promises.unlink(bookFilePath)
        } catch (error) {
            return next(createHttpError(500, 'Error while deleting file'))
        }
        
        res.status(201).json({id: newBook._id});

    } catch (error) {
        return next(createHttpError(500, 'Error while uploading files'))
    }
}

export {createBook}