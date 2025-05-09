// src/controllers/userController.ts

import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Controller class for handling user-related REST endpoints
export class UserController {
    // POST /users/register
    // Registers a new user
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const userRepo = AppDataSource.getRepository(User);
            const { username, email, password } = req.body;

            // Check if username/email already exists
            const existing = await userRepo.findOne({ where: [{ username }, { email }] });
            if (existing) {
                res.status(400);
                throw new Error("Username or email already in use");
            }

            // Hash password
            const hashed = await bcrypt.hash(password, 10);
            const user = userRepo.create({ username, email, password: hashed });

            // Save to database
            const saved = await userRepo.save(user);
            delete saved.password; // Remove password from returned object

            res.status(201).json(saved);
        } catch (err) {
            next(err);
        }
    }

    // POST /users/login
    // Logs in a user and returns JWT tokens
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const userRepo = AppDataSource.getRepository(User);
            const { email, password } = req.body;

            // Find user by email
            const user = await userRepo.findOneBy({ email });
            if (!user) {
                res.status(401);
                throw new Error("Invalid credentials");
            }

            // Compare password
            const valid = await bcrypt.compare(password, user.password??'');
            if (!valid) {
                res.status(401);
                throw new Error("Invalid credentials");
            }

            // Generate access and refresh tokens
            const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

            res.json({ accessToken, refreshToken });
        } catch (err) {
            next(err);
        }
    }

    // GET /users/profile
    // Returns current user's profile (requires auth middleware)
    static async profile(req: Request, res: Response, next: NextFunction) {
        try {
            // Assuming auth middleware populated req.userId
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { id: (req as any).userId } });
            if (!user) {
                res.status(404);
                throw new Error("User not found");
            }
            delete user.password;
            res.json(user);
        } catch (err) {
            next(err);
        }
    }
}
