import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Project } from "./Project";
import { Task } from "./Task";

// @Entity decorator marks this class as a database table
@Entity()
export class User {
    // Primary key column, auto-increment integer
    @PrimaryGeneratedColumn()
    id!: number;

    // Regular column, unique constraint ensures no duplicate usernames
    @Column({ unique: true })
    username!: string;

    // Regular column, unique constraint ensures no duplicate emails
    @Column({ unique: true })
    email!: string;

    // Column to store hashed password
    @Column()
    password?: string;

    // Role column with default value 'user'
    @Column({ default: "user" })
    role!: string;

    // One-to-many relationship: a user can own multiple projects
    @OneToMany(() => Project, project => project.owner)
    projects!: Project[];

    // One-to-many relationship: a user can be assigned many tasks
    @OneToMany(() => Task, task => task.assignee)
    tasks!: Task[];
}