// src/server.ts

import 'reflect-metadata';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';

// Local modules
import { AppDataSource } from './data-source';                        // TypeORM DataSource
import { initSentry } from './config/sentry';                          // Sentry initialization
import i18next from './config/i18n';                                   // i18n instance
import i18nextMiddleware from 'i18next-http-middleware';               // i18n middleware
import logger from './utils/logger';                                   // Winston logger
import userRoutes from './routes/userRoutes';                          // REST: users
import projectRoutes from './routes/projectRoutes';                    // REST: projects
import taskRoutes from './routes/taskRoutes';                          // REST: tasks
import uploadRoutes from './routes/uploadRoutes';                      // REST: file uploads
import redisClient from './utils/cache';                               // Redis client
import { createGraphQLServer } from './graphql';                       // GraphQL server builder

// Load environment variables
dotenv.config();

/**
 * Main function to start the HTTP + WebSocket server
 */
async function startServer(): Promise<void> {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        logger.info('Database initialized');

        // Create Express app
        const app: Application = express();

        // Initialize Sentry before other middleware
        initSentry(app);

        // Sentry request handler and tracing handler
        Sentry.setupExpressErrorHandler(app);
        // It replaces the old three - step
        // app.use(Sentry.Handlers.requestHandler());
        // app.use(Sentry.Handlers.tracingHandler());
        // app.use(Sentry.Handlers.errorHandler());

        // JSON parsing middleware
        app.use(express.json());

        // Security middlewares
        app.use(helmet());
        app.use(cors({ origin: process.env.CLIENT_URL }));
        app.use(
            rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests.' })
        );

        // Internationalization middleware
        app.use(i18nextMiddleware.handle(i18next));

        // Serve static files
        app.use(express.static(path.join(__dirname, '../public')));

        // REST routes
        app.use('/users', userRoutes);
        app.use('/projects', projectRoutes);
        app.use('/tasks', taskRoutes);
        app.use('/upload', uploadRoutes);

        // Build and apply GraphQL server
        const apolloServer = await createGraphQLServer();
        await apolloServer.start();
        apolloServer.applyMiddleware({ app, path: '/graphql' });

        // Create HTTP server (for Express + WebSocket)
        const httpServer = createServer(app);
        const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
        useServer({ schema: (apolloServer as any).schema }, wsServer);


        // Global error handler
        app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            logger.error(err.stack || err.message);
            const status = res.statusCode !== 200 ? res.statusCode : 500;
            res.status(status).json({ error: req.t(`error.${status}`) || err.message });
        });

        // Start listening
        const port = process.env.PORT || 3000;
        httpServer.listen(port, () => {
            logger.info(`Server running on http://localhost:${port}`);
            logger.info(`GraphQL endpoint: http://localhost:${port}/graphql`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Invoke main function
void startServer();
