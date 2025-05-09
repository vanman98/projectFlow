
import { Router } from "express";
import { ProjectController } from "../controllers/projectController";
import { authMiddleware } from "../utils/authMiddleware";

const router = Router();

// Public routes
router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);

// Protected routes (authenticated users only)
router.post('/', authMiddleware, ProjectController.create);
router.put('/:id', authMiddleware, ProjectController.update);
router.delete('/:id', authMiddleware, ProjectController.delete);

export default router;