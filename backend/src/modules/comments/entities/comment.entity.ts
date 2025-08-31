import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column('uuid')
    songId!: string;

  @Column('uuid')
    authorId!: string;

  @Column('text')
    content!: string;

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ default: false })
    isFlagged!: boolean;

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
