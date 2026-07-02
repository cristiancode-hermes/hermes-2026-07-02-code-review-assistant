import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PullRequestsController } from './pull-requests.controller';
import { PullRequestsService } from './pull-requests.service';
import { PullRequest } from '../common/entities/pull-request.entity';
import { ReviewFile } from '../common/entities/review-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PullRequest, ReviewFile])],
  controllers: [PullRequestsController],
  providers: [PullRequestsService],
  exports: [PullRequestsService],
})
export class PullRequestsModule {}
