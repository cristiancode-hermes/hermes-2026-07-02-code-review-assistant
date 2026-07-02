import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Review } from '../common/entities/review.entity';
import { Finding } from '../common/entities/finding.entity';
import { PullRequest } from '../common/entities/pull-request.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(Finding)
    private findingRepo: Repository<Finding>,
    @InjectRepository(PullRequest)
    private prRepo: Repository<PullRequest>,
  ) {}

  async findAll(
    userId: number,
    query: { page?: number; limit?: number; from?: string; to?: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.from || query.to) {
      where.completedAt = {};
      if (query.from) where.completedAt = MoreThanOrEqual(new Date(query.from));
      if (query.to) where.completedAt = LessThanOrEqual(new Date(query.to));
    }

    // Get PRs for this user
    const prs = await this.prRepo.find({
      where: { userId },
      select: { id: true },
    });
    const prIds = prs.map((p) => p.id);

    if (prIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    where.pullRequestId = prIds.length === 1 ? prIds[0] : In(prIds);

    const [data, total] = await this.reviewRepo.findAndCount({
      where,
      relations: { pullRequest: true, findings: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getTrend(userId: number) {
    const prs = await this.prRepo.find({
      where: { userId },
      select: { id: true },
    });
    const prIds = prs.map((p) => p.id);

    if (prIds.length === 0) return [];

    const whereClause = prIds.length === 1
      ? { pullRequestId: prIds[0] }
      : { pullRequestId: In(prIds) };

    const reviews = await this.reviewRepo.find({
      where: whereClause,
      order: { completedAt: 'ASC' },
      take: 30,
    });

    return reviews
      .filter((r) => r.overallScore !== null)
      .map((r) => ({
        date: r.completedAt?.toISOString().split('T')[0],
        score: r.overallScore,
        styleScore: r.styleScore,
        bugScore: r.bugScore,
        securityScore: r.securityScore,
        performanceScore: r.performanceScore,
      }));
  }

  async getReviewDetail(reviewId: number) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: {
        findings: { reviewFile: true },
        pullRequest: { repository: true },
      },
    });

    if (!review) return null;
    return review;
  }
}
