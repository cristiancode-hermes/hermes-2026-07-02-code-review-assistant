import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { AgentCoordinatorService } from '../agents/agent-coordinator.service';
import { Review } from '../common/entities/review.entity';
import { Finding } from '../common/entities/finding.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { PullRequest } from '../common/entities/pull-request.entity';
import { of } from 'rxjs';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepo: any;
  let findingRepo: any;
  let reviewFileRepo: any;
  let prRepo: any;
  let coordinator: any;

  const mockReviewRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({ findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Demo Repo' }) }),
    },
  };

  const mockFindingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockReviewFileRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPrRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCoordinator = {
    runReview: jest.fn(),
    rerunAgent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Finding), useValue: mockFindingRepo },
        { provide: getRepositoryToken(ReviewFile), useValue: mockReviewFileRepo },
        { provide: getRepositoryToken(PullRequest), useValue: mockPrRepo },
        { provide: AgentCoordinatorService, useValue: mockCoordinator },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepo = module.get(getRepositoryToken(Review));
    findingRepo = module.get(getRepositoryToken(Finding));
    reviewFileRepo = module.get(getRepositoryToken(ReviewFile));
    prRepo = module.get(getRepositoryToken(PullRequest));
    coordinator = module.get(AgentCoordinatorService);
  });

  describe('runReview', () => {
    it('should create mock files when PR is not found and delegate to coordinator', async () => {
      const prId = 1;
      mockPrRepo.findOne.mockResolvedValue(null);
      mockCoordinator.runReview.mockResolvedValue({
        reviewId: 42,
        stream: of({ agentName: 'style', status: 'completed' }),
      });

      const result = await service.runReview(prId);

      // Should create 3 mock files
      expect(mockReviewFileRepo.save).toHaveBeenCalledTimes(3);
      expect(mockCoordinator.runReview).toHaveBeenCalledWith(prId);
      expect(result).toHaveProperty('reviewId', 42);
      expect(result).toHaveProperty('stream');
    });

    it('should delegate to coordinator when PR exists', async () => {
      const prId = 2;
      mockPrRepo.findOne.mockResolvedValue({ id: prId, title: 'Test PR' });
      mockCoordinator.runReview.mockResolvedValue({
        reviewId: 10,
        stream: of(),
      });

      const result = await service.runReview(prId);

      expect(mockReviewFileRepo.save).not.toHaveBeenCalled();
      expect(mockCoordinator.runReview).toHaveBeenCalledWith(prId);
      expect(result.reviewId).toBe(10);
    });
  });

  describe('getReview', () => {
    it('should return review when found', async () => {
      const mockReview = { id: 1, pullRequestId: 1, status: 'completed', findings: [], pullRequest: {} };
      mockReviewRepo.findOne.mockResolvedValue(mockReview);

      const result = await service.getReview(1);
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when review not found', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);
      await expect(service.getReview(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return aggregated summary with category breakdown', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'completed',
        overallScore: 75,
        styleScore: 80,
        bugScore: 70,
        securityScore: 75,
        performanceScore: 75,
        executiveSummary: 'Found 3 issues.',
        completedAt: new Date(),
      });

      mockFindingRepo.find.mockResolvedValue([
        { agentName: 'style', severity: 'minor' },
        { agentName: 'style', severity: 'info' },
        { agentName: 'bug', severity: 'major' },
        { agentName: 'security', severity: 'critical' },
      ]);

      const result = await service.getSummary(1);

      expect(result).toHaveProperty('reviewId', 1);
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('overallScore', 75);
      expect(result.scores).toEqual({
        style: 80,
        bug: 70,
        security: 75,
        performance: 75,
      });
      expect(result.categories).toEqual({
        style: { total: 2, critical: 0, major: 0, minor: 1, info: 1 },
        bug: { total: 1, critical: 0, major: 1, minor: 0, info: 0 },
        security: { total: 1, critical: 1, major: 0, minor: 0, info: 0 },
        performance: { total: 0, critical: 0, major: 0, minor: 0, info: 0 },
      });
      expect(result.totalFindings).toBe(4);
    });

    it('should throw NotFoundException when review not found', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);
      await expect(service.getSummary(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rerunAgent', () => {
    it('should delegate to coordinator and return updated review', async () => {
      mockCoordinator.rerunAgent.mockResolvedValue(undefined);
      mockReviewRepo.findOne.mockResolvedValue({
        id: 1,
        pullRequestId: 1,
        status: 'completed',
      });

      const result = await service.rerunAgent(1, 'bug');
      expect(mockCoordinator.rerunAgent).toHaveBeenCalledWith(1, 'bug');
      expect(result).toHaveProperty('pullRequestId', 1);
    });
  });

  describe('getFindings', () => {
    it('should filter findings by severity, category, and file', async () => {
      mockReviewRepo.findOne.mockResolvedValue({ id: 1 });

      // Mock for file lookup
      mockReviewFileRepo.findOne.mockResolvedValue({ id: 10 });
      mockFindingRepo.find.mockResolvedValue([{ id: 1, reviewFileId: 10, severity: 'critical' }]);

      const result = await service.getFindings(1, {
        severity: 'critical',
        category: 'security',
        file: 'src/app.ts',
      });

      expect(mockFindingRepo.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          reviewId: 1,
          severity: 'critical',
          agentName: 'security',
          reviewFileId: 10,
        }),
        relations: { reviewFile: true },
        order: { severity: 'ASC', createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getFindingsStats', () => {
    it('should return aggregated stats for findings', async () => {
      mockReviewRepo.findOne.mockResolvedValue({ id: 1 });
      mockFindingRepo.find.mockResolvedValue([
        { severity: 'critical', agentName: 'security' },
        { severity: 'major', agentName: 'bug' },
        { severity: 'minor', agentName: 'style' },
        { severity: 'info', agentName: 'style' },
        { severity: 'critical', agentName: 'security' },
      ]);

      const result = await service.getFindingsStats(1);

      expect(result).toEqual({
        total: 5,
        severity: { critical: 2, major: 1, minor: 1, info: 1 },
        categories: { security: 2, bug: 1, style: 2 },
      });
    });
  });
});
