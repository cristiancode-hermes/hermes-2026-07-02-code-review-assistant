import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PullRequestsService } from './pull-requests.service';
import { PullRequest } from '../common/entities/pull-request.entity';
import { ReviewFile } from '../common/entities/review-file.entity';

describe('PullRequestsService', () => {
  let service: PullRequestsService;
  let prRepo: any;
  let reviewFileRepo: any;

  const mockPrRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockReviewFileRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PullRequestsService,
        { provide: getRepositoryToken(PullRequest), useValue: mockPrRepo },
        { provide: getRepositoryToken(ReviewFile), useValue: mockReviewFileRepo },
      ],
    }).compile();

    service = module.get<PullRequestsService>(PullRequestsService);
    prRepo = module.get(getRepositoryToken(PullRequest));
    reviewFileRepo = module.get(getRepositoryToken(ReviewFile));
  });

  describe('findAll', () => {
    it('should return all PRs for a repository with relations', async () => {
      const mockPrs = [
        { id: 1, repositoryId: 1, title: 'PR 1', user: { id: 1 }, review: null },
        { id: 2, repositoryId: 1, title: 'PR 2', user: { id: 1 }, review: { id: 1 } },
      ];
      mockPrRepo.find.mockResolvedValue(mockPrs);

      const result = await service.findAll(1, 1);

      expect(mockPrRepo.find).toHaveBeenCalledWith({
        where: { repositoryId: 1 },
        relations: { user: true, review: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a PR when found', async () => {
      const mockPr = { id: 1, repositoryId: 1, title: 'Test PR' };
      mockPrRepo.findOne.mockResolvedValue(mockPr);

      const result = await service.findOne(1, 1, 1);
      expect(result).toEqual(mockPr);
    });

    it('should throw NotFoundException when PR not found', async () => {
      mockPrRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(1, 999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a PR with open status', async () => {
      const dto = {
        title: 'New feature',
        description: 'Adds login',
        baseBranch: 'main',
        sourceBranch: 'feature/login',
      };
      mockPrRepo.create.mockReturnValue({ id: 1, ...dto, status: 'open' });
      mockPrRepo.save.mockResolvedValue({ id: 1, ...dto, status: 'open' });

      const result = await service.create(1, 1, dto);

      expect(mockPrRepo.create).toHaveBeenCalledWith({
        repositoryId: 1,
        userId: 1,
        title: 'New feature',
        description: 'Adds login',
        baseBranch: 'main',
        sourceBranch: 'feature/login',
        status: 'open',
      });
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('status', 'open');
    });
  });

  describe('delete', () => {
    it('should remove a PR when found', async () => {
      mockPrRepo.findOne.mockResolvedValue({ id: 1, repositoryId: 1 });
      mockPrRepo.remove.mockResolvedValue({ id: 1 });

      const result = await service.delete(1, 1, 1);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getDiff', () => {
    it('should return diff files for a PR', async () => {
      mockPrRepo.findOne.mockResolvedValue({ id: 1, repositoryId: 1 });
      const mockFiles = [
        { id: 1, pullRequestId: 1, filePath: 'src/app.ts', status: 'modified' },
      ];
      mockReviewFileRepo.find.mockResolvedValue(mockFiles);

      const result = await service.getDiff(1, 1, 1);
      expect(result).toEqual(mockFiles);
    });
  });

  describe('getFileDiff', () => {
    it('should return a specific file diff', async () => {
      mockPrRepo.findOne.mockResolvedValue({ id: 1, repositoryId: 1 });
      mockReviewFileRepo.findOne.mockResolvedValue({
        id: 10,
        pullRequestId: 1,
        filePath: 'src/app.ts',
      });

      const result = await service.getFileDiff(1, 1, 10, 1);
      expect(result).toHaveProperty('id', 10);
    });

    it('should throw NotFoundException when file not found', async () => {
      mockPrRepo.findOne.mockResolvedValue({ id: 1, repositoryId: 1 });
      mockReviewFileRepo.findOne.mockResolvedValue(null);

      await expect(service.getFileDiff(1, 1, 999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
