import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { PullRequest } from './pull-request.entity';
import { Finding } from './finding.entity';

@Entity()
@Unique(['pullRequestId', 'filePath'])
export class ReviewFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  pullRequestId: number;

  @ManyToOne(() => PullRequest, (pr) => pr.reviewFiles)
  pullRequest: PullRequest;

  @Column({ type: 'varchar', length: 1000 })
  filePath: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'int', default: 0 })
  additions: number;

  @Column({ type: 'int', default: 0 })
  deletions: number;

  @Column({ type: 'text', nullable: true })
  diffContent: string | null;

  @OneToMany(() => Finding, (finding) => finding.reviewFile)
  findings: Finding[];
}
