// src/data-source.ts


import { DataSource } from "typeorm";                // Import TypeORM DataSource class for DB connection
import path from "path";                              // Node.js path helper for cross-platform file paths
import dotenv from "dotenv";                          // Loads .env variables into process.env

// Import entity classes (tables) used by TypeORM
import { User } from "./models/User";                  // User entity representing users table
import { Project } from "./models/Project";            // Project entity representing projects table
import { Task } from "./models/Task";                  // Task entity representing tasks table

// Apply environment variables before using any process.env
dotenv.config();

// Create and export a DataSource instance for database connections
export const AppDataSource = new DataSource({
    type: "sqlite",                                      // Use SQLite database
    // Compute database path relative to this file
    database: path.join(
        __dirname,                                         // Directory of this file (src/)
        process.env.DATABASE_PATH || "../../database.sqlite"  // Use DATABASE_PATH from .env or default
    ),
    synchronize: false,                                   // Disable auto-sync; use migrations to manage schema
    logging: true,                                        // Enable SQL query logging for debugging
    entities: [User, Project, Task],                      // Register entity classes
    migrations: [__dirname + "/migrations/*{.ts,.js}"], // Glob pattern to find migration files
    subscribers: [],                                      // (Optional) register event subscribers here
});

// Usage note:
// - Call AppDataSource.initialize() in server startup to establish the DB connection.
// - Use DataSource instance to get repositories and run migrations.
