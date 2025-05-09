// src/loaders/userLoader.ts

import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';

/**
 * Batch function to load multiple users by their IDs in one query.
 * @param userIds - array of user ID keys to fetch
 * @returns Promise resolving to an array of Users (index-aligned)
 */
const batchUsers = async (userIds: readonly number[]): Promise<(User | null)[]> => {
    // Query for all users whose ID is in the provided list
    const users = await AppDataSource.getRepository(User)
        .findBy({ id: In(userIds as number[]) });

    // Map found users by ID for quick lookup
    const userMap: Record<number, User> = {};
    users.forEach(user => {
        userMap[user.id] = user;
    });

    // Return users in the same order as the input keys
    return userIds.map(id => userMap[id] || null);
};

/**
 * Factory to create a new DataLoader instance for each request
 */
export const createUserLoader = (): DataLoader<number, User | null> => {
    return new DataLoader<number, User | null>(batchUsers);
};

// ====================================================================
// Integrate in Apollo Server context (src/server.ts):
//
// import { createUserLoader } from './loaders/userLoader';
//
// const apolloServer = new ApolloServer({
//   schema,
//   context: () => ({
//     userLoader: createUserLoader(),
//     // ... other context values
//   }),
// });
//
// Use in GraphQL resolver:
//
// @FieldResolver(() => UserType)
// async assignee(@Root() task: Task, @Ctx() { userLoader }: Context) {
//   return userLoader.load(task.assignee.id);
// }

// ====================================================================
// Notes:
// - Each HTTP request should get its own loader instance to ensure caching is scoped per request.
// - DataLoader helps avoid the N+1 problem by batching multiple load calls into a single database query.
