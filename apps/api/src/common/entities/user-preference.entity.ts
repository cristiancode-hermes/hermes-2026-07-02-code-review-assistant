import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.preferences)
  @JoinColumn()
  user: User;

  @Column({ type: 'varchar', length: 200, default: 'typescript,python,sql,html' })
  languages: string;

  @Column({ type: 'varchar', length: 20, default: 'info' })
  minSeverity: string;

  @Column({ type: 'boolean', default: true })
  styleEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  bugEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  securityEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  performanceEnabled: boolean;
}
