import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Project } from "./Project";
import { User } from "./User";

@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ default: false }) // Default to not completed
    completed!: boolean;

    @Column({ nullable: true })
    description?: string;

    // Many-to-one: each task belongs to one project
    @ManyToOne(() => Project, project => project.tasks)
    @JoinColumn() // Creates `projectId` foreign key
    project!: Project;

    // Many-to-one: each task is assigned to one user
    @ManyToOne(() => User, user => user.tasks)
    @JoinColumn() // Creates `assigneeId` foreign key
    assignee!: User;
}
