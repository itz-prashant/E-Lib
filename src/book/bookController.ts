import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from 'node:fs'
import { Authrequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) =>{

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
        
        const _req = req as Authrequest

        const newBook = await bookModel.create({
            title,
            genre,
            author: _req.userId,
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

const updateBook = async (req: Request, res: Response, next: NextFunction) =>{
    
    const {title, genre} = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({_id: bookId})

    if(!book){
        return next(createHttpError(404, 'Book not found'))
    }

    const _req = req as Authrequest

    if(book.author.toString() !== _req.userId){
        return next(createHttpError(403, 'You can not update others book.'))
    }

    const files = req.files as{[fieldname: string]: Express.Multer.File[]}

    let completeCoverImage = ""

    if(files.coverImage){
        
        const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1)

        const filename = files.coverImage[0].filename;

        const filePath = path.resolve(__dirname, '../../public/data/uploads', filename);

        completeCoverImage = filename;

        try {
            const uploadResult = await cloudinary.uploader.upload(filePath, {
                filename_override: completeCoverImage,
                folder: 'book-covers',
                format: coverImageMimeType,
            })
            completeCoverImage = uploadResult.secure_url
            await fs.promises.unlink(filePath)
        } catch (error) {
            console.log(error);
        }
    }

    let completeFileName = ""

    if(files.file){

        const bookFileName = files.file[0].filename
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName)

        completeFileName = bookFileName;

        const uploadResult = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: 'raw',
            filename_override: completeFileName,
            folder: 'book-pdfs',
            format: "pdf"
        })
        completeFileName = uploadResult.secure_url
        await fs.promises.unlink(bookFilePath)
    }

    try {
        const updateBook = await bookModel.findOneAndUpdate(
            {_id: bookId},
            {
                title: title,
                genre: genre,
                coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
                files: completeFileName? completeFileName : book.file
            },
            {new: true}
        )
        res.json(updateBook)
    } catch (error) {
        console.log(error);
    }
}

const listBook = async (req: Request, res: Response, next: NextFunction)=>{

    try {
        const book = await bookModel.find().populate('author', 'name');
        res.json(book);

    } catch (error) {
        return next(createHttpError(500, "Error while getting a book"))
    }

}

const getSingleBook = async (req: Request, res: Response, next: NextFunction)=>{

    const bookId = req.params.bookId
    try {
        const book = await bookModel.findOne({_id: bookId});
        if(!book){
            return next(createHttpError(404, "Book not found"))
        }
        res.json(book);

    } catch (error) {
        return next(createHttpError(500, "Error while getting a book"))
    }

}

const deleteBook = async (req: Request, res: Response, next: NextFunction)=>{

    const bookId = req.params.bookId
    try {
        const book = await bookModel.findOne({_id: bookId});
        if(!book){
            return next(createHttpError(404, "Book not found"))
        }

        const _req = req as Authrequest

        if(book.author.toString() !== _req.userId){
            return next(createHttpError(403, 'You can not update others book.'))
        }

        const coverFilesSplit= book.coverImage.split('/')
        const coverImagePublicId = coverFilesSplit.at(-2)+'/'+ (coverFilesSplit.at(-1)?.split('.').at(-2))

        const bookFilesSplit = book.file.split('/')
        const bookFilePublicId = bookFilesSplit.at(-2)+'/'+ (bookFilesSplit.at(-1))

        try {
            await cloudinary.uploader.destroy(coverImagePublicId)

            await cloudinary.uploader.destroy(bookFilePublicId,{resource_type: "raw"})
        } catch (error) {
            return next(createHttpError(400, "Error while deleting cloudinary"))
        }

        await bookModel.deleteOne({_id: bookId})
        res.sendStatus(204);

    } catch (error) {
        return next(createHttpError(500, "Error while deleting a book"))
    }

}

export {createBook, updateBook, listBook, getSingleBook, deleteBook}