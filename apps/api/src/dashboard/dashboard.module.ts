import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Review } from '../common/entities/review.entity';
import { PullRequest } from '../common/entities/pull-request.entity';
import { Finding } from '../common/entities/finding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, PullRequest, Finding])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
