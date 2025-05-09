
// src/routes/userRoutes.ts

import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authMiddleware } from "../utils/authMiddleware";

const router = Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected route (requires valid JWT)
router.get('/profile', authMiddleware, UserController.profile);

export default router;
