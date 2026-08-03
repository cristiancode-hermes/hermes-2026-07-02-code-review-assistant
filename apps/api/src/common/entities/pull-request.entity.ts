import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Repository } from './repository.entity';
import { Review } from './review.entity';
import { ReviewFile } from './review-file.entity';

@Entity()
export class PullRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  repositoryId: number;

  @ManyToOne(() => Repository, (repo) => repo.pullRequests)
  repository: Repository;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100 })
  baseBranch: string;

  @Column({ type: 'varchar', length: 100 })
  sourceBranch: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(() => Review, (review) => review.pullRequest)
  @JoinColumn()
  review: Review;

  @OneToMany(() => ReviewFile, (rf) => rf.pullRequest)
  reviewFiles: ReviewFile[];
}
