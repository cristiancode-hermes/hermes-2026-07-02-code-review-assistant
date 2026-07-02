import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Subject } from 'rxjs';
import { AgentCoordinatorService } from './agent-coordinator.service';
import { LocalHeuristicStrategy } from './strategies/local-heuristic.strategy';
import { OpenAIStrategy } from './strategies/openai.strategy';
import { StyleAgent } from './agents/style-agent';
import { BugAgent } from './agents/bug-agent';
import { SecurityAgent } from './agents/security-agent';
import { PerformanceAgent } from './agents/performance-agent';
import { Review } from '../common/entities/review.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { Finding } from '../common/entities/finding.entity';
import { Finding as FindingInterface } from './types/finding.interface';

describe('AgentCoordinatorService', () => {
  let service: AgentCoordinatorService;
  let reviewRepo: any;
  let reviewFileRepo: any;
  let findingRepo: any;
  let styleAgent: any;
  let bugAgent: any;
  let securityAgent: any;
  let performanceAgent: any;
  let localHeuristic: any;
  let openAIStrategy: any;
  let configService: any;

  const mockReviewRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockReviewFileRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFindingRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockStyleAgent = { analyze: jest.fn() };
  const mockBugAgent = { analyze: jest.fn() };
  const mockSecurityAgent = { analyze: jest.fn() };
  const mockPerformanceAgent = { analyze: jest.fn() };

  const mockLocalHeuristic = { analyze: jest.fn() };
  const mockOpenAIStrategy = { analyze: jest.fn() };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(null), // No API key => uses local heuristic
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentCoordinatorService,
        { provide: LocalHeuristicStrategy, useValue: mockLocalHeuristic },
        { provide: OpenAIStrategy, useValue: mockOpenAIStrategy },
        { provide: StyleAgent, useValue: mockStyleAgent },
        { provide: BugAgent, useValue: mockBugAgent },
        { provide: SecurityAgent, useValue: mockSecurityAgent },
        { provide: PerformanceAgent, useValue: mockPerformanceAgent },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(ReviewFile), useValue: mockReviewFileRepo },
        { provide: getRepositoryToken(Finding), useValue: mockFindingRepo },
      ],
    }).compile();

    service = module.get<AgentCoordinatorService>(AgentCoordinatorService);
    reviewRepo = module.get(getRepositoryToken(Review));
    reviewFileRepo = module.get(getRepositoryToken(ReviewFile));
    findingRepo = module.get(getRepositoryToken(Finding));
    styleAgent = module.get(StyleAgent);
    bugAgent = module.get(BugAgent);
    securityAgent = module.get(SecurityAgent);
    performanceAgent = module.get(PerformanceAgent);
  });

  describe('runReview', () => {
    it('should create a review, run all 4 agents, and produce findings with correct structure', async () => {
      const prId = 42;

      // No existing review
      mockReviewRepo.findOne.mockResolvedValueOnce(null);
      mockReviewRepo.create.mockReturnValue({
        id: 1,
        pullRequestId: prId,
        status: 'pending',
      });
      mockReviewRepo.save.mockResolvedValueOnce({
        id: 1,
        pullRequestId: prId,
        status: 'pending',
      });

      // Mock files
      const mockFiles = [
        {
          id: 10,
          pullRequestId: prId,
          filePath: 'src/app.ts',
          diffContent: 'const x = 1;\nconst y = 2;',
        },
        {
          id: 11,
          pullRequestId: prId,
          filePath: 'src/utils.ts',
          diffContent: 'function foo() {\n  var a = 1;\n}',
        },
      ];
      mockReviewFileRepo.find.mockResolvedValue(mockFiles);

      // Mock agent responses — each agent returns findings for file 10, then file 11
      const styleFindings: FindingInterface[] = [
        {
          file: 'src/app.ts',
          line: 1,
          severity: 'minor',
          category: 'style',
          message: 'Missing semicolon',
          suggestion: 'Add semicolon',
          ruleId: 'STYLE-003',
        },
      ];
      const bugFindings: FindingInterface[] = [
        {
          file: 'src/utils.ts',
          line: 2,
          severity: 'major',
          category: 'bug',
          message: 'Using var declaration',
          suggestion: 'Use const/let',
          ruleId: 'BUG-002',
        },
      ];
      const securityFindings: FindingInterface[] = [];
      const perfFindings: FindingInterface[] = [];

      // Each agent called twice (once per file)
      mockStyleAgent.analyze
        .mockResolvedValueOnce(styleFindings) // file 10
        .mockResolvedValueOnce([]); // file 11
      mockBugAgent.analyze
        .mockResolvedValueOnce([]) // file 10
        .mockResolvedValueOnce(bugFindings); // file 11
      mockSecurityAgent.analyze.mockResolvedValue(securityFindings);
      mockPerformanceAgent.analyze.mockResolvedValue(perfFindings);

      // Mock findingRepo.create and findingRepo.save
      mockFindingRepo.create.mockImplementation((data) => ({
        id: Math.floor(Math.random() * 10000),
        ...data,
      }));
      mockFindingRepo.save.mockResolvedValue([]);
      mockFindingRepo.find.mockResolvedValue([]); // For severity counts

      // Execute
      const result = await service.runReview(prId);

      // runAsyncReview is fire-and-forget, flush microtasks to let it complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify review was created
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { pullRequestId: prId },
        relations: { pullRequest: true },
      });
      expect(mockReviewRepo.create).toHaveBeenCalledWith({
        pullRequestId: prId,
        status: 'pending',
      });

      // Verify files were fetched
      expect(mockReviewFileRepo.find).toHaveBeenCalledWith({
        where: { pullRequestId: prId },
      });

      // Verify review status updated to running then completed
      expect(mockReviewRepo.save).toHaveBeenCalled();

      // Verify we get a structured response
      expect(result).toHaveProperty('reviewId');
      expect(result).toHaveProperty('stream');
      expect(result.reviewId).toBe(1);

      // Verify all 4 agents were called
      expect(styleAgent.analyze).toHaveBeenCalledTimes(2);
      expect(bugAgent.analyze).toHaveBeenCalledTimes(2);
      expect(securityAgent.analyze).toHaveBeenCalledTimes(2);
      expect(performanceAgent.analyze).toHaveBeenCalledTimes(2);

      // Verify findings were created with correct structure
      expect(mockFindingRepo.create).toHaveBeenCalled();
      const createCalls = mockFindingRepo.create.mock.calls;
      for (const [findingData] of createCalls) {
        expect(findingData).toHaveProperty('reviewId');
        expect(findingData).toHaveProperty('reviewFileId');
        expect(findingData).toHaveProperty('agentName');
        expect(findingData).toHaveProperty('severity');
        expect(findingData).toHaveProperty('message');
        expect(findingData).toHaveProperty('lineStart');
      }
    });

    it('should handle empty files (no diff) gracefully', async () => {
      const prId = 99;

      mockReviewRepo.findOne.mockResolvedValueOnce(null);
      mockReviewRepo.create.mockReturnValue({ id: 2, pullRequestId: prId });
      mockReviewRepo.save.mockResolvedValueOnce({ id: 2, pullRequestId: prId });

      // No files for this PR
      mockReviewFileRepo.find.mockResolvedValue([]);

      const result = await service.runReview(prId);

      // Should return early with score 0
      expect(result.reviewId).toBe(2);
      expect(result.stream).toBeDefined();

      // Agents should NOT be called when there are no files
      expect(styleAgent.analyze).not.toHaveBeenCalled();
      expect(bugAgent.analyze).not.toHaveBeenCalled();

      // Review should be marked completed
      const saveCalls = mockReviewRepo.save.mock.calls;
      const lastSaved = saveCalls[saveCalls.length - 1][0];
      expect(lastSaved.status).toBe('completed');
      expect(lastSaved.overallScore).toBe(0);
      expect(lastSaved.executiveSummary).toBe('No files to review.');
    });
  });

  describe('rerunAgent', () => {
    it('should delete existing findings for an agent and re-run analysis', async () => {
      const prId = 42;
      const agentName = 'bug';

      const mockReview = {
        id: 1,
        pullRequestId: prId,
        styleScore: 100,
        bugScore: 100,
        securityScore: 100,
        performanceScore: 100,
        overallScore: 100,
      };

      mockReviewRepo.findOne.mockResolvedValueOnce(mockReview);

      const mockFiles = [
        {
          id: 10,
          pullRequestId: prId,
          filePath: 'src/app.ts',
          diffContent: 'var x = 1;',
        },
      ];
      mockReviewFileRepo.find.mockResolvedValue(mockFiles);

      mockBugAgent.analyze.mockResolvedValueOnce([
        {
          file: 'src/app.ts',
          line: 1,
          severity: 'major',
          category: 'bug',
          message: 'Using var',
          suggestion: 'Use const',
          ruleId: 'BUG-002',
        },
      ]);

      mockFindingRepo.create.mockImplementation((data) => data);
      mockFindingRepo.save.mockResolvedValue([]);
      mockReviewRepo.save.mockResolvedValue(mockReview);

      await service.rerunAgent(prId, agentName);

      // Verify existing findings deleted
      expect(mockFindingRepo.delete).toHaveBeenCalledWith({
        reviewId: 1,
        agentName: 'bug',
      });

      // Verify agent was re-run
      expect(mockBugAgent.analyze).toHaveBeenCalledTimes(1);

      // Verify scores recalculated
      expect(mockReviewRepo.save).toHaveBeenCalled();
    });

    it('should throw error for unknown agent name', async () => {
      const prId = 42;

      mockReviewRepo.findOne.mockResolvedValueOnce({
        id: 1,
        pullRequestId: prId,
      });

      await expect(
        service.rerunAgent(prId, 'unknown-agent'),
      ).rejects.toThrow('Unknown agent: unknown-agent');
    });
  });
});
