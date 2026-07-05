import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositoriesService } from './repositories.service';
import { Repository as RepoEntity } from '../common/entities/repository.entity';
import { Like } from 'typeorm';

describe('RepositoriesService', () => {
  let service: RepositoriesService;
  let repoRepo: any;

  const mockRepoRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoriesService,
        { provide: getRepositoryToken(RepoEntity), useValue: mockRepoRepo },
      ],
    }).compile();

    service = module.get<RepositoriesService>(RepositoriesService);
    repoRepo = module.get(getRepositoryToken(RepoEntity));
  });

  describe('findAll', () => {
    it('should return all repositories for a user', async () => {
      const userId = 1;
      const mockRepos = [
        { id: 1, name: 'frontend', userId },
        { id: 2, name: 'backend', userId },
      ];
      mockRepoRepo.find.mockResolvedValue(mockRepos);

      const result = await service.findAll(userId, {});

      expect(mockRepoRepo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockRepos);
    });

    it('should support search filter', async () => {
      await service.findAll(1, { search: 'front' });

      expect(mockRepoRepo.find).toHaveBeenCalledWith({
        where: { userId: 1, name: Like('%front%') },
        order: { createdAt: 'DESC' },
      });
    });

    it('should support sort and order parameters', async () => {
      await service.findAll(1, { sort: 'name', order: 'ASC' });

      expect(mockRepoRepo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return repository when found and owned by user', async () => {
      const mockRepo = { id: 1, userId: 1, name: 'test', user: { id: 1 } };
      mockRepoRepo.findOne.mockResolvedValue(mockRepo);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockRepo);
      expect(mockRepoRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { user: true },
      });
    });

    it('should throw NotFoundException when repository not found', async () => {
      mockRepoRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when repository belongs to different user', async () => {
      mockRepoRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });
      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create and return a new repository', async () => {
      const dto = { name: 'my-app', localPath: '/path/to/app', defaultBranch: 'main' };
      mockRepoRepo.create.mockReturnValue({ id: 1, userId: 1, ...dto });
      mockRepoRepo.save.mockResolvedValue({ id: 1, userId: 1, ...dto });

      const result = await service.create(1, dto);

      expect(mockRepoRepo.create).toHaveBeenCalledWith({
        userId: 1,
        name: 'my-app',
        localPath: '/path/to/app',
        defaultBranch: 'main',
      });
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('delete', () => {
    it('should remove repository when found and owned', async () => {
      mockRepoRepo.findOne.mockResolvedValue({ id: 1, userId: 1 });
      mockRepoRepo.remove.mockResolvedValue({ id: 1 });

      const result = await service.delete(1, 1);
      expect(result).toEqual({ deleted: true });
      expect(mockRepoRepo.remove).toHaveBeenCalled();
    });
  });

  describe('getBranches', () => {
    it('should return default branch list', async () => {
      mockRepoRepo.findOne.mockResolvedValue({ id: 1, userId: 1 });
      const result = await service.getBranches(1, 1);
      expect(result).toEqual(['main', 'develop', 'feature/*', 'hotfix/*']);
    });
  });

  describe('getStats', () => {
    it('should return repo stats with PR counts', async () => {
      mockRepoRepo.findOne
        .mockResolvedValueOnce({ id: 1, userId: 1, defaultBranch: 'main' })
        .mockResolvedValueOnce({
          id: 1,
          defaultBranch: 'main',
          pullRequests: [
            { id: 1, status: 'open' },
            { id: 2, status: 'open' },
            { id: 3, status: 'closed' },
          ],
        });

      const result = await service.getStats(1, 1);
      expect(result).toEqual({
        totalPRs: 3,
        openPRs: 2,
        defaultBranch: 'main',
      });
    });
  });
});
