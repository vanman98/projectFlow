// src/utils/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Custom TypeScript declaration to augment Express Request
declare global {
    namespace Express {
        interface Request {
            userId?: number;
            userRole?: string;
        }
    }
}

// Middleware to verify JWT and attach user info to the request
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract token from the Authorization header "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401);
            throw new Error("Authorization header missing");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401);
            throw new Error("Token missing");
        }

        // Verify token using JWT_SECRET
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: number;
            role: string;
        };

        // Attach user info to request object
        req.userId = payload.userId;
        req.userRole = payload.role;

        next(); // proceed to next middleware/controller
    } catch (err: any) {
        // Pass error to global error handler
        next(err);
    }
};
