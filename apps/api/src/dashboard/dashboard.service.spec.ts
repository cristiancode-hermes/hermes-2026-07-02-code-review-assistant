import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Review } from '../common/entities/review.entity';
import { PullRequest } from '../common/entities/pull-request.entity';
import { Finding } from '../common/entities/finding.entity';
import { In } from 'typeorm';

describe('DashboardService', () => {
  let service: DashboardService;
  let reviewRepo: any;
  let prRepo: any;
  let findingRepo: any;

  const mockReviewRepo = {
    find: jest.fn(),
  };

  const mockPrRepo = {
    find: jest.fn(),
  };

  const mockFindingRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(PullRequest), useValue: mockPrRepo },
        { provide: getRepositoryToken(Finding), useValue: mockFindingRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    reviewRepo = module.get(getRepositoryToken(Review));
    prRepo = module.get(getRepositoryToken(PullRequest));
    findingRepo = module.get(getRepositoryToken(Finding));
  });

  describe('getStats', () => {
    it('should return stats with aggregated data', async () => {
      const userId = 1;
      const mockPrs = [
        { id: 1, userId, status: 'open' },
        { id: 2, userId, status: 'closed' },
        { id: 3, userId, status: 'open' },
      ];
      const mockReviews = [
        { id: 1, status: 'completed', overallScore: 80 },
        { id: 2, status: 'completed', overallScore: 90 },
        { id: 3, status: 'pending', overallScore: null },
      ];

      mockPrRepo.find.mockResolvedValue(mockPrs);
      mockReviewRepo.find.mockResolvedValue(mockReviews);
      mockFindingRepo.find
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }])
        .mockResolvedValueOnce([]);

      const result = await service.getStats(userId);

      expect(result).toEqual({
        totalReviews: 3,
        completedReviews: 2,
        totalFindings: 3,
        averageScore: 85,
        totalPRs: 3,
        openPRs: 2,
      });
    });

    it('should return zeros when user has no PRs', async () => {
      mockPrRepo.find.mockResolvedValue([]);
      mockReviewRepo.find.mockResolvedValue([]);

      const result = await service.getStats(1);

      expect(result).toEqual({
        totalReviews: 0,
        completedReviews: 0,
        totalFindings: 0,
        averageScore: 0,
        totalPRs: 0,
        openPRs: 0,
      });
    });
  });

  describe('getRecentReviews', () => {
    it('should return last 5 reviews with PR relations', async () => {
      mockPrRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const mockReviews = [
        { id: 5, pullRequest: { id: 1, title: 'PR 5' }, createdAt: new Date('2026-07-01') },
        { id: 4, pullRequest: { id: 2, title: 'PR 4' }, createdAt: new Date('2026-06-30') },
      ];
      mockReviewRepo.find.mockResolvedValue(mockReviews);

      const result = await service.getRecentReviews(1);

      expect(mockReviewRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          order: { createdAt: 'DESC' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('pullRequest');
    });

    it('should return empty when user has no PRs', async () => {
      mockPrRepo.find.mockResolvedValue([]);
      const result = await service.getRecentReviews(1);
      expect(result).toEqual([]);
    });
  });

  describe('getScoreByCategory', () => {
    it('should return average scores per category', async () => {
      mockPrRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockReviewRepo.find.mockResolvedValue([
        { styleScore: 80, bugScore: 70, securityScore: 90, performanceScore: 60 },
        { styleScore: 90, bugScore: 80, securityScore: 70, performanceScore: 80 },
      ]);

      const result = await service.getScoreByCategory(1);

      expect(result).toEqual({
        style: 85,
        bug: 75,
        security: 80,
        performance: 70,
      });
    });

    it('should return zeros when user has no PRs', async () => {
      mockPrRepo.find.mockResolvedValue([]);
      const result = await service.getScoreByCategory(1);
      expect(result).toEqual({ style: 0, bug: 0, security: 0, performance: 0 });
    });
  });
});
