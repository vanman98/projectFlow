import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";

// Controller for task-related REST endpoints
export class TaskController {
    // GET /tasks
    // Retrieve all tasks, optionally filter by project or assignee
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const taskRepo = AppDataSource.getRepository(Task);
            const { projectId, assigneeId } = req.query;
            const where: any = {};
            if (projectId) where.project = { id: Number(projectId) };
            if (assigneeId) where.assignee = { id: Number(assigneeId) };

            const tasks = await taskRepo.find({
                where,
                relations: ["project", "assignee"] // Eager load related entities
            });
            res.json(tasks);
        } catch (err) {
            next(err);
        }
    }

    // GET /tasks/:id
    // Retrieve single task by ID
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const taskRepo = AppDataSource.getRepository(Task);
            const id = parseInt(req.params.id, 10);
            const task = await taskRepo.findOne({
                where: { id },
                relations: ["project", "assignee"]
            });
            if (!task) {
                res.status(404);
                throw new Error("Task not found");
            }
            res.json(task);
        } catch (err) {
            next(err);
        }
    }

    // POST /tasks
    // Create a new task; requires authentication
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const taskRepo = AppDataSource.getRepository(Task);
            const { title, description, projectId, assigneeId } = req.body;

            // Build related references
            const project = { id: projectId };
            const assignee = { id: assigneeId };

            const task = taskRepo.create({ title, description, project, assignee });
            const saved = await taskRepo.save(task);
            res.status(201).json(saved);
        } catch (err) {
            next(err);
        }
    }

    // PUT /tasks/:id
    // Update an existing task; only assignee or project owner or admin can update
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const taskRepo = AppDataSource.getRepository(Task);
            const id = parseInt(req.params.id, 10);
            const existing = await taskRepo.findOne({ where: { id }, relations: ["assignee", "project", "project.owner"] });
            if (!existing) {
                res.status(404);
                throw new Error("Task not found");
            }

            // Authorization: assignee, project owner, or admin
            const userId = (req as any).userId;
            const userRole = (req as any).userRole;
            const isOwner = existing.project.owner.id === userId;
            const isAssignee = existing.assignee.id === userId;
            if (!isOwner && !isAssignee && userRole !== 'admin') {
                res.status(403);
                throw new Error("Forbidden");
            }

            taskRepo.merge(existing, req.body);
            const updated = await taskRepo.save(existing);
            res.json(updated);
        } catch (err) {
            next(err);
        }
    }

    // DELETE /tasks/:id
    // Delete a task; only assignee or project owner or admin
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const taskRepo = AppDataSource.getRepository(Task);
            const id = parseInt(req.params.id, 10);
            const existing = await taskRepo.findOne({ where: { id }, relations: ["assignee", "project", "project.owner"] });
            if (!existing) {
                res.status(404);
                throw new Error("Task not found");
            }
            const userId = (req as any).userId;
            const userRole = (req as any).userRole;
            const isOwner = existing.project.owner.id === userId;
            const isAssignee = existing.assignee.id === userId;
            if (!isOwner && !isAssignee && userRole !== 'admin') {
                res.status(403);
                throw new Error("Forbidden");
            }
            await taskRepo.delete(id);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}