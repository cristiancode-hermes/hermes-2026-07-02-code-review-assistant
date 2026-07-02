import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AgentCoordinatorService } from './agent-coordinator.service';
import { LocalHeuristicStrategy } from './strategies/local-heuristic.strategy';
import { OpenAIStrategy } from './strategies/openai.strategy';
import { StyleAgent } from './agents/style-agent';
import { BugAgent } from './agents/bug-agent';
import { SecurityAgent } from './agents/security-agent';
import { PerformanceAgent } from './agents/performance-agent';
import { Review } from '../common/entities/review.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { Finding } from '../common/entities/finding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewFile, Finding]),
    ConfigModule,
  ],
  providers: [
    AgentCoordinatorService,
    LocalHeuristicStrategy,
    OpenAIStrategy,
    StyleAgent,
    BugAgent,
    SecurityAgent,
    PerformanceAgent,
    {
      provide: 'CodeAnalysisStrategy',
      useClass: LocalHeuristicStrategy,
    },
  ],
  exports: [AgentCoordinatorService],
})
export class AgentsModule {}
