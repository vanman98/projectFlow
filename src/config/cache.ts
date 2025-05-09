import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import dotenv from 'dotenv';

// Load environment variables from .env file so process.env.REDIS_URL is populated
dotenv.config();

/**
 * Initialize and configure a Redis client for caching purposes.
 * RedisClientType: TypeScript type for the Redis client instance.
 */
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient: RedisClientType = createClient({ url: redisUrl });

// Handle Redis connection errors
redisClient.on('error', (err: Error) => {
    logger.error(`Redis Client Error: ${err.message}`);
});

// Log successful connection event
redisClient.on('connect', () => {
    logger.info(`Connected to Redis at ${redisUrl}`);
});

// Establish connection to Redis server
redisClient.connect().catch((err: Error) => {
    logger.error(`Failed to connect to Redis: ${err.message}`);
});

// Export the connected Redis client for use across the application
export default redisClient;