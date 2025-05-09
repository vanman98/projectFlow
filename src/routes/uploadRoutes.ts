
import { Router, Request, Response, NextFunction } from "express";
import { upload } from "../utils/multerConfig";

const router = Router();

/**
 * POST /upload
 * Single file upload endpoint.
 * Expects form-data field named "file" containing the file to upload.
 */
router.post(
    "/upload",
    upload.single("file"),  // Multer middleware: handle single file
    (req: Request, res: Response, next: NextFunction) => {
        try {
            // If no file was uploaded, return error
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded" });
                return;
            }
            // Respond with file metadata
            res.status(200).json({
                message: "File uploaded successfully",
                filename: req.file.filename,              // stored filename
                path: `/uploads/${req.file.filename}`    // public URL path
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
