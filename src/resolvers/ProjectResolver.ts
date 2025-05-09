// src/resolvers/ProjectResolver.ts

import { Resolver, Query, Mutation, Arg, Field, ObjectType, InputType, Int, FieldResolver, Root, Ctx, PubSub, Publisher, Subscription } from 'type-graphql';
import { AppDataSource } from '../data-source';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { createUserLoader } from '../loaders/userLoader';

/**
 * GraphQL Object Type for Project, defining the fields exposed to clients.
 */
@ObjectType()
class ProjectType {
    @Field(() => Int)
    id!: number;

    @Field()
    name!: string;

    @Field({ nullable: true })
    description?: string;

    @Field(() => User)
    owner!: User;

    @Field(() => [Task])
    tasks!: Task[];
}

/**
 * InputType for creating or updating a Project via GraphQL mutations.
 */
@InputType()
class ProjectInput {
    @Field()
    name!: string;

    @Field({ nullable: true })
    description?: string;

    @Field(() => Int)
    ownerId!: number;
}

/**
 * Resolver class for Project-related GraphQL operations.
 */
@Resolver(() => ProjectType)
export class ProjectResolver {
    /**
     * Query: Fetch all projects, including owner and tasks relations.
     */
    @Query(() => [ProjectType])
    async projects(): Promise<Project[]> {
        const repo = AppDataSource.getRepository(Project);
        return await repo.find({ relations: ['owner', 'tasks'] });
    }

    /**
     * Query: Fetch a single project by its ID.
     */
    @Query(() => ProjectType, { nullable: true })
    async project(
        @Arg('id', () => Int) id: number
    ): Promise<Project | null> {
        const repo = AppDataSource.getRepository(Project);
        return await repo.findOne({ where: { id }, relations: ['owner', 'tasks'] });
    }

    /**
     * Mutation: Create a new project and publish an event for subscriptions.
     */
    @Mutation(() => ProjectType)
    async createProject(
        @Arg('data') data: ProjectInput,
        @PubSub('PROJECT_CREATED') publish: Publisher<Project>
    ): Promise<Project> {
        const repo = AppDataSource.getRepository(Project);
        // Instantiate a new Project entity linking owner by ID
        const project = repo.create({
            name: data.name,
            description: data.description,
            owner: { id: data.ownerId } as User,
        });
        // Save to database
        const saved = await repo.save(project);
        // Publish the event for real-time subscribers
        await publish(saved);
        return saved;
    }

    /**
     * Mutation: Update an existing project by merging input fields.
     */
    @Mutation(() => ProjectType)
    async updateProject(
        @Arg('id', () => Int) id: number,
        @Arg('data') data: ProjectInput
    ): Promise<Project> {
        const repo = AppDataSource.getRepository(Project);
        const existing = await repo.findOneBy({ id });
        if (!existing) throw new Error('Project not found');
        // Merge changes
        repo.merge(existing, {
            name: data.name,
            description: data.description,
            owner: { id: data.ownerId } as User,
        });
        return await repo.save(existing);
    }

    /**
     * Mutation: Delete a project, returning true if deletion was successful.
     */
    @Mutation(() => Boolean)
    async deleteProject(
        @Arg('id', () => Int) id: number
    ): Promise<boolean> {
        const repo = AppDataSource.getRepository(Project);
        const result = await repo.delete(id);
        // affected indicates number of rows deleted
        return result.affected !== 0;
    }

    /**
     * Subscription: Listen for newly created projects.
     */
    @Subscription({ topics: 'PROJECT_CREATED' })
    newProject(@Root() project: Project): Project {
        return project;
    }

    /**
     * FieldResolver: Batch-load the project owner using DataLoader to avoid N+1 queries.
     */
    @FieldResolver(() => User)
    async owner(
        @Root() project: Project,
        @Ctx() context: { userLoader: ReturnType<typeof createUserLoader> }
    ): Promise<User | null> {
        return await context.userLoader.load(project.owner.id);
    }

    /**
     * FieldResolver: Retrieve tasks for the project via a standard DB lookup.
     */
    @FieldResolver(() => [Task])
    async tasks(@Root() project: Project): Promise<Task[]> {
        const repo = AppDataSource.getRepository(Task);
        return await repo.find({ where: { project: { id: project.id } } });
    }
}
