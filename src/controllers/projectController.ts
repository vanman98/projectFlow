import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Project } from "../models/Project";

// Controller class for handling project-related REST endpoints
export class ProjectController {
    // GET /projects
    // Retrieves all projects (optional: pagination, filtering)
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const projectRepo = AppDataSource.getRepository(Project);
            const projects = await projectRepo.find({
                relations: ["owner"] // Eager-load owner relation
            });
            res.json(projects);
        } catch (err) {
            next(err);
        }
    }

    // GET /projects/:id
    // Retrieves a single project by ID
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const projectRepo = AppDataSource.getRepository(Project);
            const project = await projectRepo.findOne({
                where: { id: parseInt(req.params.id, 10) },
                relations: ["owner", "tasks"]
            });
            if (!project) {
                res.status(404);
                throw new Error("Project not found");
            }
            res.json(project);
        } catch (err) {
            next(err);
        }
    }

    // POST /projects
    // Creates a new project; requires authenticated user
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const projectRepo = AppDataSource.getRepository(Project);
            const { name, description } = req.body;

            // req.userId set by authMiddleware
            const owner = { id: (req as any).userId };
            const project = projectRepo.create({ name, description, owner });

            const saved = await projectRepo.save(project);
            res.status(201).json(saved);
        } catch (err) {
            next(err);
        }
    }

    // PUT /projects/:id
    // Updates an existing project; only owner or admin can update
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const projectRepo = AppDataSource.getRepository(Project);
            const id = parseInt(req.params.id, 10);
            const existing = await projectRepo.findOneBy({ id });
            if (!existing) {
                res.status(404);
                throw new Error("Project not found");
            }
            // Only owner or admin
            const userId = (req as any).userId;
            const userRole = (req as any).userRole;
            if (existing.owner.id !== userId && userRole !== 'admin') {
                res.status(403);
                throw new Error("Forbidden");
            }
            projectRepo.merge(existing, req.body);
            const updated = await projectRepo.save(existing);
            res.json(updated);
        } catch (err) {
            next(err);
        }
    }

    // DELETE /projects/:id
    // Deletes a project; only owner or admin can delete
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const projectRepo = AppDataSource.getRepository(Project);
            const id = parseInt(req.params.id, 10);
            const existing = await projectRepo.findOneBy({ id });
            if (!existing) {
                res.status(404);
                throw new Error("Project not found");
            }
            const userId = (req as any).userId;
            const userRole = (req as any).userRole;
            if (existing.owner.id !== userId && userRole !== 'admin') {
                res.status(403);
                throw new Error("Forbidden");
            }
            await projectRepo.delete(id);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}