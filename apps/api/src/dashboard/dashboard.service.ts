import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from '../common/entities/review.entity';
import { PullRequest } from '../common/entities/pull-request.entity';
import { Finding } from '../common/entities/finding.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(PullRequest)
    private prRepo: Repository<PullRequest>,
    @InjectRepository(Finding)
    private findingRepo: Repository<Finding>,
  ) {}

  async getStats(userId: number) {
    const prs = await this.prRepo.find({
      where: { userId },
      relations: { review: true },
    });

    const prIds = prs.map((p) => p.id);
    let totalReviews = 0;
    let totalFindings = 0;
    let avgScore = 0;
    let completedReviews = 0;

    const whereClause = prIds.length > 0
      ? { pullRequestId: prIds.length === 1 ? prIds[0] : In(prIds) }
      : { pullRequestId: -1 };

    const reviews = await this.reviewRepo.find({ where: whereClause });

    totalReviews = reviews.length;
    completedReviews = reviews.filter((r) => r.status === 'completed').length;

    for (const review of reviews) {
      if (review.overallScore !== null) {
        avgScore += review.overallScore;
      }
      const findings = await this.findingRepo.find({
        where: { reviewId: review.id },
      });
      totalFindings += findings.length;
    }

    if (completedReviews > 0) {
      avgScore = Math.round(avgScore / completedReviews);
    }

    return {
      totalReviews,
      completedReviews,
      totalFindings,
      averageScore: avgScore,
      totalPRs: prs.length,
      openPRs: prs.filter((p) => p.status === 'open').length,
    };
  }

  async getRecentReviews(userId: number) {
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
      relations: { pullRequest: true },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return reviews;
  }

  async getActivity(userId: number) {
    const prs = await this.prRepo.find({
      where: { userId },
      relations: { review: true },
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    return prs.map((pr) => ({
      id: pr.id,
      title: pr.title,
      status: pr.status,
      reviewStatus: pr.review?.status || 'none',
      updatedAt: pr.updatedAt,
    }));
  }

  async getScoreByCategory(userId: number) {
    const prs = await this.prRepo.find({
      where: { userId },
      select: { id: true },
    });
    const prIds = prs.map((p) => p.id);

    if (prIds.length === 0) return { style: 0, bug: 0, security: 0, performance: 0 };

    const whereClause = prIds.length === 1
      ? { pullRequestId: prIds[0], status: 'completed' as const }
      : { pullRequestId: In(prIds), status: 'completed' as const };

    const reviews = await this.reviewRepo.find({
      where: whereClause,
      order: { completedAt: 'DESC' },
      take: 10,
    });

    const scores = { style: 0, bug: 0, security: 0, performance: 0 };
    if (reviews.length === 0) return scores;

    for (const r of reviews) {
      scores.style += r.styleScore || 0;
      scores.bug += r.bugScore || 0;
      scores.security += r.securityScore || 0;
      scores.performance += r.performanceScore || 0;
    }

    const count = reviews.length;
    return {
      style: Math.round(scores.style / count),
      bug: Math.round(scores.bug / count),
      security: Math.round(scores.security / count),
      performance: Math.round(scores.performance / count),
    };
  }
}
