import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Repository as RepoEntity } from '../common/entities/repository.entity';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Injectable()
export class RepositoriesService {
  constructor(
    @InjectRepository(RepoEntity)
    private repoRepo: Repository<RepoEntity>,
  ) {}

  async findAll(
    userId: number,
    query: { search?: string; sort?: string; order?: 'ASC' | 'DESC' },
  ) {
    const where: any = { userId };
    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }
    const order: any = {};
    if (query.sort) {
      order[query.sort] = query.order || 'ASC';
    } else {
      order.createdAt = 'DESC';
    }
    return this.repoRepo.find({ where, order });
  }

  async findOne(id: number, userId: number) {
    const repo = await this.repoRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!repo) throw new NotFoundException('Repository not found');
    if (repo.userId !== userId) throw new ForbiddenException();
    return repo;
  }

  async create(userId: number, dto: CreateRepositoryDto) {
    const repo = this.repoRepo.create({
      userId,
      name: dto.name,
      localPath: dto.localPath,
      defaultBranch: dto.defaultBranch || 'main',
    });
    return this.repoRepo.save(repo);
  }

  async update(id: number, userId: number, dto: UpdateRepositoryDto) {
    const repo = await this.findOne(id, userId);
    Object.assign(repo, dto);
    return this.repoRepo.save(repo);
  }

  async delete(id: number, userId: number) {
    const repo = await this.findOne(id, userId);
    await this.repoRepo.remove(repo);
    return { deleted: true };
  }

  async getBranches(id: number, userId: number) {
    await this.findOne(id, userId);
    return ['main', 'develop', 'feature/*', 'hotfix/*'];
  }

  async getStats(id: number, userId: number) {
    const repo = await this.findOne(id, userId);
    const repoWithPrs = await this.repoRepo.findOne({
      where: { id },
      relations: { pullRequests: true },
    });
    const pullRequests = repoWithPrs?.pullRequests || [];
    return {
      totalPRs: pullRequests.length || 0,
      openPRs: pullRequests.filter((pr) => pr.status === 'open').length || 0,
      defaultBranch: repo.defaultBranch,
    };
  }
}
