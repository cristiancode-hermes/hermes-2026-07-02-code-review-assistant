import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { Repository } from '../common/entities/repository.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Repository])],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
