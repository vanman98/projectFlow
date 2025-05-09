// src/resolvers/UserResolver.ts

import { Resolver, Query, Mutation, Arg, Field, ObjectType, InputType } from 'type-graphql';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// GraphQL type for User, excluding password
@ObjectType()
class UserType {
    @Field()
    id!: number;

    @Field()
    username!: string;

    @Field()
    email!: string;

    @Field()
    role!: string;
}

// Input for registration
@InputType()
class RegisterInput {
    @Field()
    username!: string;

    @Field()
    email!: string;

    @Field()
    password!: string;
}

// Input for login
@InputType()
class LoginInput {
    @Field()
    email!: string;

    @Field()
    password!: string;
}

@Resolver(() => UserType)
export class UserResolver {
    // Query all users (admin only)
    @Query(() => [UserType])
    async users(): Promise<User[]> {
        const repo = AppDataSource.getRepository(User);
        // Exclude passwords in resolver by selecting only safe fields
        return await repo.find({ select: ['id', 'username', 'email', 'role'] });
    }

    // Query current user profile
    @Query(() => UserType, { nullable: true })
    async me(@Arg('token') token: string): Promise<User | null> {
        try {
            // Verify token
            const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
            const repo = AppDataSource.getRepository(User);
            const user = await repo.findOne({ where: { id: payload.userId } });
            if (!user) return null;
            delete user.password;
            return user;
        } catch {
            return null;
        }
    }

    // Mutation register
    @Mutation(() => UserType)
    async register(
        @Arg('data') data: RegisterInput
    ): Promise<User> {
        const repo = AppDataSource.getRepository(User);
        const { username, email, password } = data;
        // Check duplicates
        const exists = await repo.findOne({ where: [{ username }, { email }] });
        if (exists) throw new Error('Username or email already in use');
        // Hash password and save
        const hashed = await bcrypt.hash(password, 10);
        const user = repo.create({ username, email, password: hashed });
        const saved = await repo.save(user);
        delete saved.password;
        return saved;
    }

    // Mutation login
    @Mutation(() => String)
    async login(
        @Arg('data') data: LoginInput
    ): Promise<string> {
        const repo = AppDataSource.getRepository(User);
        const { email, password } = data;
        const user = await repo.findOne({ where: { email } });
        if (!user) throw new Error('Invalid credentials');
        const valid = await bcrypt.compare(password, user.password??'');
        if (!valid) throw new Error('Invalid credentials');
        // Sign JWT
        return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
            expiresIn: '15m'
        });
    }
}
