import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { Task } from "./Task";

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true }) // Nullable description
    description?: string;

    // Many-to-one relationship: each project has one owner (User)
    @ManyToOne(() => User, user => user.projects)
    @JoinColumn() // Creates `ownerId` foreign key column
    owner!: User;

    // One-to-many relationship: a project can have multiple tasks
    @OneToMany(() => Task, task => task.project)
    tasks!: Task[];
}