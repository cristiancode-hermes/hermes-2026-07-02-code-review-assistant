import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Review } from './review.entity';
import { ReviewFile } from './review-file.entity';

@Entity()
export class Finding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  reviewId: number;

  @ManyToOne(() => Review, (review) => review.findings)
  review: Review;

  @Column({ type: 'int' })
  reviewFileId: number;

  @ManyToOne(() => ReviewFile, (rf) => rf.findings)
  reviewFile: ReviewFile;

  @Column({ type: 'varchar', length: 20 })
  agentName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ruleId: string | null;

  @Column({ type: 'varchar', length: 20 })
  severity: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  suggestion: string | null;

  @Column({ type: 'int' })
  lineStart: number;

  @Column({ type: 'int', nullable: true })
  lineEnd: number | null;

  @Column({ type: 'int', nullable: true })
  column: number | null;

  @Column({ type: 'text', nullable: true })
  codeSnippet: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
