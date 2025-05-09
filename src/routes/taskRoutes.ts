
// src/routes/taskRoutes.ts
import { Router } from "express";
import { TaskController } from "../controllers/taskController";
import { authMiddleware } from "../utils/authMiddleware";

const router = Router();

// Public routes
router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);

// Protected routes
router.post('/', authMiddleware, TaskController.create);
router.put('/:id', authMiddleware, TaskController.update);
router.delete('/:id', authMiddleware, TaskController.delete);

export default router;
