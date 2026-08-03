import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PullRequest } from './pull-request.entity';
import { Finding } from './finding.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  pullRequestId: number;

  @OneToOne(() => PullRequest, (pr) => pr.review)
  @JoinColumn()
  pullRequest: PullRequest;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'int', nullable: true })
  styleScore: number | null;

  @Column({ type: 'int', nullable: true })
  bugScore: number | null;

  @Column({ type: 'int', nullable: true })
  securityScore: number | null;

  @Column({ type: 'int', nullable: true })
  performanceScore: number | null;

  @Column({ type: 'int', nullable: true })
  overallScore: number | null;

  @Column({ type: 'text', nullable: true })
  executiveSummary: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => Finding, (finding) => finding.review)
  findings: Finding[];
}
