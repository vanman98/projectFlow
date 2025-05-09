// src/resolvers/TaskResolver.ts

import { Resolver, Query, Mutation, Arg, Int, Field, ObjectType, InputType, FieldResolver, Root, Ctx, PubSub, Publisher, Subscription } from 'type-graphql';
import { Task } from '../models/Task';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { createUserLoader } from '../loaders/userLoader';
import { PubSubEngine } from 'graphql-subscriptions';

// ObjectType to shape Task data returned by GraphQL
@ObjectType()
class TaskType {
    @Field(() => Int)
    id!: number;

    @Field()
    title!: string;

    @Field({ defaultValue: false })
    completed!: boolean;

    @Field({ nullable: true })
    description?: string;

    // Expose related project and assignee via resolvers
    @Field(() => Project)
    project!: Project;

    @Field(() => User)
    assignee!: User;
}

// InputType for creating/updating tasks
@InputType()
class TaskInput {
    @Field()
    title!: string;

    @Field({ nullable: true })
    description?: string;

    @Field(() => Int)
    projectId!: number;

    @Field(() => Int)
    assigneeId!: number;
}

// Resolver for Task queries, mutations, and subscriptions
@Resolver(() => TaskType)
export class TaskResolver {
    // Query to fetch all tasks
    @Query(() => [TaskType])
    async tasks(): Promise<Task[]> {
        const taskRepo = AppDataSource.getRepository(Task);
        // Fetch all tasks with relations to project and assignee
        return await taskRepo.find({ relations: ['project', 'assignee'] });
    }

    // Query to fetch a task by its ID
    @Query(() => TaskType, { nullable: true })
    async task(
        @Arg('id', () => Int) id: number
    ): Promise<Task | null> {
        const taskRepo = AppDataSource.getRepository(Task);
        return await taskRepo.findOne({ where: { id }, relations: ['project', 'assignee'] });
    }

    // Mutation to create a new task; publishes event for subscriptions
    @Mutation(() => TaskType)
    async createTask(
        @Arg('data') data: TaskInput,
        @PubSub('TASK_CREATED') publish: Publisher<Task>
    ): Promise<Task> {
        const taskRepo = AppDataSource.getRepository(Task);
        // Create task entity (link project and user by IDs)
        const task = taskRepo.create({
            title: data.title,
            description: data.description,
            project: { id: data.projectId } as Project,
            assignee: { id: data.assigneeId } as User,
        });
        const saved = await taskRepo.save(task);
        // Publish the new task for subscribers
        await publish(saved);
        return saved;
    }

    // Mutation to update an existing task
    @Mutation(() => TaskType)
    async updateTask(
        @Arg('id', () => Int) id: number,
        @Arg('data') data: TaskInput
    ): Promise<Task> {
        const taskRepo = AppDataSource.getRepository(Task);
        const existing = await taskRepo.findOneBy({ id });
        if (!existing) throw new Error('Task not found');
        // Merge input data onto existing entity
        taskRepo.merge(existing, {
            title: data.title,
            description: data.description,
            project: { id: data.projectId } as Project,
            assignee: { id: data.assigneeId } as User,
        });
        return await taskRepo.save(existing);
    }

    // Mutation to delete a task by ID
    @Mutation(() => Boolean)
    async deleteTask(
        @Arg('id', () => Int) id: number
    ): Promise<boolean> {
        const taskRepo = AppDataSource.getRepository(Task);
        const result = await taskRepo.delete(id);
        // delete() returns DeleteResult; check affected rows
        return result.affected !== 0;
    }

    // Subscription to listen for newly created tasks
    @Subscription({ topics: 'TASK_CREATED' })
    newTask(
        @Root() task: Task
    ): Task {
        return task;
    }

    // Field resolver for assignee using DataLoader to batch
    @FieldResolver(() => User)
    async assignee(
        @Root() task: Task,
        @Ctx() context: { userLoader: ReturnType<typeof createUserLoader> }
    ): Promise<User | null> {
        return await context.userLoader.load(task.assignee.id);
    }

    // Field resolver for project (no loading optimization needed here)
    @FieldResolver(() => Project)
    async project(@Root() task: Task): Promise<Project> {
        const projectRepo = AppDataSource.getRepository(Project);
        return await projectRepo.findOneBy({ id: task.project.id }) as Project;
    }
}
