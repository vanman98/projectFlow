// src/graphql.ts

import 'reflect-metadata';                        // Required for TypeGraphQL decorators
import { buildSchema } from 'type-graphql';       // Schema builder for TypeGraphQL
import { ApolloServer } from 'apollo-server-express';
import { UserResolver } from './resolvers/UserResolver';
import { ProjectResolver } from './resolvers/ProjectResolver';
import { TaskResolver } from './resolvers/TaskResolver';
import { createUserLoader } from './loaders/userLoader';

/**
 * Builds the GraphQL schema and returns an ApolloServer instance
 * configured with context including DataLoaders for batching.
 */
export async function createGraphQLServer() {
    // Build executable GraphQL schema from resolvers and types
    const schema = await buildSchema({
        resolvers: [UserResolver, ProjectResolver, TaskResolver],
        validate: false,
    });

    // Create Apollo Server, injecting DataLoader into context
    const server = new ApolloServer({
        schema,
        context: ({ req, res }) => ({
            req,
            res,
            userLoader: createUserLoader(), // Scoped user loader per request
        }),
    });

    return server;
}
