// src/utils/logger.ts

import { createLogger, format, transports } from 'winston';

// Define log format: timestamp and printf
const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Create Winston logger instance
const logger = createLogger({
    level: 'info', // Log only if info.level less than or equal to this
    format: combine(
        colorize(),    // Colorize log level
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat      // Custom message format
    ),
    transports: [
        new transports.Console(),               // Log to console
        new transports.File({ filename: 'logs/error.log', level: 'error' }),   // Errors to error.log
        new transports.File({ filename: 'logs/combined.log' })               // All logs to combined.log
    ],
    exitOnError: false, // Do not exit on handled exceptions
});

export default logger;
