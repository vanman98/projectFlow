// src/utils/cache.ts
import { createClient } from 'redis';
import logger from './logger';

const redisClient = createClient({
    // Use an environment variable or default to localhost
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Handle errors
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));

// Connect to Redis (this returns a promise; here we start the connection immediately)
redisClient.connect().then(() => {
    logger.info('Connected to Redis');
});

export default redisClient;
