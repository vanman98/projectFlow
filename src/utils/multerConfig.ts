
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

/**
 * Configure Multer storage engine and file filtering for uploads.
 */

// Destination: define where to store uploaded files on disk
const storage = multer.diskStorage({
    // destination callback: determine folder
    destination: (req: Request, file, cb) => {
        // store under /public/uploads relative to project root
        cb(null, path.join(__dirname, "../../public/uploads"));
    },
    // filename callback: create unique filenames
    filename: (req: Request, file, cb) => {
        // timestamp + random number to avoid collisions
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        // maintain original file extension
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File filter: allow only image uploads
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // Check MIME type starts with 'image/'
    if (!file.mimetype.startsWith("image/")) {
        // reject file if not an image
        return cb(new Error("Only image files are allowed!") as any, false);
    }
    // Accept the file
    cb(null, true);
};

// Export configured Multer instance
export const upload = multer({
    storage,           // storage engine defined above
    fileFilter,        // file type validation
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});