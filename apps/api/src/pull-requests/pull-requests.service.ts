import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PullRequest } from '../common/entities/pull-request.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { CreatePrDto } from './dto/create-pr.dto';
import { UpdatePrDto } from './dto/update-pr.dto';

@Injectable()
export class PullRequestsService {
  constructor(
    @InjectRepository(PullRequest)
    private prRepo: Repository<PullRequest>,
    @InjectRepository(ReviewFile)
    private reviewFileRepo: Repository<ReviewFile>,
  ) {}

  async findAll(repoId: number, userId: number) {
    return this.prRepo.find({
      where: { repositoryId: repoId },
      relations: { user: true, review: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(repoId: number, id: number, userId: number) {
    const pr = await this.prRepo.findOne({
      where: { id, repositoryId: repoId },
      relations: { user: true, review: true, repository: true },
    });
    if (!pr) throw new NotFoundException('Pull request not found');
    return pr;
  }

  async create(repoId: number, userId: number, dto: CreatePrDto) {
    const pr = this.prRepo.create({
      repositoryId: repoId,
      userId,
      title: dto.title,
      description: dto.description || null,
      baseBranch: dto.baseBranch,
      sourceBranch: dto.sourceBranch,
      status: 'open',
    });
    return this.prRepo.save(pr);
  }

  async update(repoId: number, id: number, userId: number, dto: UpdatePrDto) {
    const pr = await this.findOne(repoId, id, userId);
    Object.assign(pr, dto);
    return this.prRepo.save(pr);
  }

  async delete(repoId: number, id: number, userId: number) {
    const pr = await this.findOne(repoId, id, userId);
    await this.prRepo.remove(pr);
    return { deleted: true };
  }

  async getDiff(repoId: number, id: number, userId: number) {
    await this.findOne(repoId, id, userId);
    const files = await this.reviewFileRepo.find({
      where: { pullRequestId: id },
    });
    return files;
  }

  async getFileDiff(repoId: number, id: number, fileId: number, userId: number) {
    await this.findOne(repoId, id, userId);
    const file = await this.reviewFileRepo.findOne({
      where: { id: fileId, pullRequestId: id },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }
}
