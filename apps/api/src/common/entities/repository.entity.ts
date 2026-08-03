import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { PullRequest } from './pull-request.entity';

@Entity()
export class Repository {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, (user) => user.repositories)
  user: User;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 1000 })
  localPath: string;

  @Column({ type: 'varchar', length: 100, default: 'main' })
  defaultBranch: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => PullRequest, (pr) => pr.repository)
  pullRequests: PullRequest[];
}
