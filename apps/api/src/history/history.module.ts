import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { Review } from '../common/entities/review.entity';
import { Finding } from '../common/entities/finding.entity';
import { PullRequest } from '../common/entities/pull-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Finding, PullRequest])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
