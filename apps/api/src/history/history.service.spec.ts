import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { Review } from '../common/entities/review.entity';
import { Finding } from '../common/entities/finding.entity';
import { PullRequest } from '../common/entities/pull-request.entity';

describe('HistoryService', () => {
  let service: HistoryService;
  let reviewRepo: any;
  let prRepo: any;

  const mockReviewRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockFindingRepo = {
    find: jest.fn(),
  };

  const mockPrRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Finding), useValue: mockFindingRepo },
        { provide: getRepositoryToken(PullRequest), useValue: mockPrRepo },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
    reviewRepo = module.get(getRepositoryToken(Review));
    prRepo = module.get(getRepositoryToken(PullRequest));
  });

  describe('findAll', () => {
    it('should return paginated results with default pagination', async () => {
      const userId = 1;
      mockPrRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockReviewRepo.findAndCount.mockResolvedValue([
        [
          { id: 1, pullRequestId: 1, status: 'completed', findings: [], pullRequest: {} },
          { id: 2, pullRequestId: 2, status: 'completed', findings: [], pullRequest: {} },
        ],
        2,
      ]);

      const result = await service.findAll(userId, {});

      expect(result).toEqual({
        data: expect.any(Array),
        total: 2,
        page: 1,
        limit: 20,
      });
      expect(mockReviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter by date range when provided', async () => {
      const userId = 1;
      mockPrRepo.find.mockResolvedValue([{ id: 1 }]);
      mockReviewRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(userId, {
        from: '2026-06-01',
        to: '2026-06-30',
        page: 2,
        limit: 10,
      });

      expect(mockReviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should return empty results when user has no PRs', async () => {
      mockPrRepo.find.mockResolvedValue([]);

      const result = await service.findAll(1, {});

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
      expect(mockReviewRepo.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('getTrend', () => {
    it('should return trending scores over time', async () => {
      mockPrRepo.find.mockResolvedValue([{ id: 1 }]);

      const mockReviews = [
        {
          completedAt: new Date('2026-06-28'),
          overallScore: 70,
          styleScore: 70,
          bugScore: 70,
          securityScore: 70,
          performanceScore: 70,
        },
        {
          completedAt: new Date('2026-06-29'),
          overallScore: 85,
          styleScore: 80,
          bugScore: 85,
          securityScore: 90,
          performanceScore: 85,
        },
      ];
      mockReviewRepo.find.mockResolvedValue(mockReviews);

      const result = await service.getTrend(1);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-06-28');
      expect(result[0].score).toBe(70);
      expect(result[1].score).toBe(85);
    });

    it('should return empty when user has no PRs', async () => {
      mockPrRepo.find.mockResolvedValue([]);
      const result = await service.getTrend(1);
      expect(result).toEqual([]);
    });
  });

  describe('getReviewDetail', () => {
    it('should return review with full relations', async () => {
      const mockReview = {
        id: 1,
        findings: [{ id: 1, reviewFile: { id: 1, filePath: 'src/app.ts' } }],
        pullRequest: { id: 1, title: 'Test PR', repository: { id: 1, name: 'test-repo' } },
      };
      mockReviewRepo.findOne.mockResolvedValue(mockReview);

      const result = await service.getReviewDetail(1);

      expect(result).toEqual(mockReview);
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          findings: { reviewFile: true },
          pullRequest: { repository: true },
        },
      });
    });

    it('should return null when review not found', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);
      const result = await service.getReviewDetail(999);
      expect(result).toBeNull();
    });
  });
});
