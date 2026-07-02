import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AgentsModule } from '../agents/agents.module';
import { Review } from '../common/entities/review.entity';
import { Finding } from '../common/entities/finding.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { PullRequest } from '../common/entities/pull-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Finding, ReviewFile, PullRequest]),
    AgentsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
