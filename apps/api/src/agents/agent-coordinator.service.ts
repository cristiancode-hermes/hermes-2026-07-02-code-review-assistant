import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CodeAnalysisStrategy } from './strategies/code-analysis.strategy';
import { LocalHeuristicStrategy } from './strategies/local-heuristic.strategy';
import { OpenAIStrategy } from './strategies/openai.strategy';
import { StyleAgent } from './agents/style-agent';
import { BugAgent } from './agents/bug-agent';
import { SecurityAgent } from './agents/security-agent';
import { PerformanceAgent } from './agents/performance-agent';
import { Review } from '../common/entities/review.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { Finding } from '../common/entities/finding.entity';
import { AgentStatus } from './types/agent-status.interface';

export interface AgentProgress {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findingsCount?: number;
  error?: string;
}

@Injectable()
export class AgentCoordinatorService {
  private readonly logger = new Logger(AgentCoordinatorService.name);
  private strategy: CodeAnalysisStrategy;

  constructor(
    private localHeuristic: LocalHeuristicStrategy,
    private openAIStrategy: OpenAIStrategy,
    private styleAgent: StyleAgent,
    private bugAgent: BugAgent,
    private securityAgent: SecurityAgent,
    private performanceAgent: PerformanceAgent,
    private configService: ConfigService,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ReviewFile)
    private reviewFileRepo: Repository<ReviewFile>,
    @InjectRepository(Finding)
    private findingRepo: Repository<Finding>,
  ) {
    // Use OpenAI strategy if API key is configured, otherwise local heuristic
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && !apiKey.startsWith('sk-you')) {
      this.strategy = this.openAIStrategy;
    } else {
      this.strategy = this.localHeuristic;
    }
  }

  async runReview(
    prId: number,
  ): Promise<{ reviewId: number; stream: Observable<AgentProgress> }> {
    const progressSubject = new Subject<AgentProgress>();

    // Create or get the review record
    let review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
      relations: { pullRequest: true },
    });

    if (!review) {
      review = this.reviewRepo.create({
        pullRequestId: prId,
        status: 'pending',
      });
      review = await this.reviewRepo.save(review);
    }

    // Get all files for this PR
    const files = await this.reviewFileRepo.find({
      where: { pullRequestId: prId },
    });

    if (files.length === 0) {
      review.status = 'completed';
      review.overallScore = 0;
      review.executiveSummary = 'No files to review.';
      review.completedAt = new Date();
      await this.reviewRepo.save(review);

      progressSubject.next({
        agentName: 'system',
        status: 'completed',
        findingsCount: 0,
      });
      progressSubject.complete();
      return { reviewId: review.id, stream: progressSubject.asObservable() };
    }

    // Run review asynchronously
    this.runAsyncReview(review, files, progressSubject);

    return { reviewId: review.id, stream: progressSubject.asObservable() };
  }

  private async runAsyncReview(
    review: Review,
    files: ReviewFile[],
    progressSubject: Subject<AgentProgress>,
  ) {
    try {
      review.status = 'running';
      await this.reviewRepo.save(review);

      const agents = [
        { name: 'style', agent: this.styleAgent },
        { name: 'bug', agent: this.bugAgent },
        { name: 'security', agent: this.securityAgent },
        { name: 'performance', agent: this.performanceAgent },
      ];

      let totalFindings = 0;
      const scores: Record<string, number> = {
        style: 100,
        bug: 100,
        security: 100,
        performance: 100,
      };

      for (const { name, agent } of agents) {
        progressSubject.next({
          agentName: name,
          status: 'running',
        });

        try {
          const fileFindings: Finding[] = [];

          for (const file of files) {
            const fileText = file.diffContent || '';
            const context = { reviewId: review.id, file };

            const agentFindings = await agent.analyze(
              fileText,
              file.filePath,
              context,
            );

            for (const f of agentFindings) {
              const finding = this.findingRepo.create({
                reviewId: review.id,
                reviewFileId: file.id,
                agentName: name,
                ruleId: f.ruleId || null,
                severity: f.severity,
                message: f.message,
                suggestion: f.suggestion || null,
                lineStart: f.line,
                lineEnd: null,
                column: f.column || null,
                codeSnippet: null,
              });
              fileFindings.push(finding);
            }
          }

          if (fileFindings.length > 0) {
            await this.findingRepo.save(fileFindings);
          }

          // Calculate score for this category
          const severityWeights: Record<string, number> = {
            critical: 10,
            major: 5,
            minor: 2,
            info: 1,
          };
          const deduction = fileFindings.reduce(
            (sum, f) => sum + (severityWeights[f.severity] || 1),
            0,
          );
          scores[name] = Math.max(0, 100 - deduction);
          totalFindings += fileFindings.length;

          progressSubject.next({
            agentName: name,
            status: 'completed',
            findingsCount: fileFindings.length,
          });
        } catch (err: any) {
          this.logger.error(`Agent ${name} failed: ${err.message}`);
          progressSubject.next({
            agentName: name,
            status: 'failed',
            error: err.message,
          });
        }
      }

      // Calculate overall score
      const overallScore = Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / 4,
      );

      // Generate executive summary
      const severityCounts = { critical: 0, major: 0, minor: 0, info: 0 };
      const allFindings = await this.findingRepo.find({
        where: { reviewId: review.id },
      });
      for (const f of allFindings) {
        severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
      }

      const summaryParts: string[] = [];
      if (totalFindings === 0) {
        summaryParts.push('No issues found. The code looks clean!');
      } else {
        summaryParts.push(`Found ${totalFindings} issue(s) across all categories.`);
        if (severityCounts.critical > 0)
          summaryParts.push(`${severityCounts.critical} critical,`);
        if (severityCounts.major > 0)
          summaryParts.push(`${severityCounts.major} major,`);
        if (severityCounts.minor > 0)
          summaryParts.push(`${severityCounts.minor} minor,`);
        if (severityCounts.info > 0)
          summaryParts.push(`${severityCounts.info} info.`);
      }
      summaryParts.push(`Overall code quality score: ${overallScore}/100.`);

      // Update review
      review.status = 'completed';
      review.styleScore = scores['style'];
      review.bugScore = scores['bug'];
      review.securityScore = scores['security'];
      review.performanceScore = scores['performance'];
      review.overallScore = overallScore;
      review.executiveSummary = summaryParts.join(' ');
      review.completedAt = new Date();
      await this.reviewRepo.save(review);

      progressSubject.next({
        agentName: 'system',
        status: 'completed',
        findingsCount: totalFindings,
      });
      progressSubject.complete();
    } catch (err: any) {
      this.logger.error(`Review failed: ${err.message}`);
      review.status = 'failed';
      await this.reviewRepo.save(review);

      progressSubject.next({
        agentName: 'system',
        status: 'failed',
        error: err.message,
      });
      progressSubject.complete();
    }
  }

  async rerunAgent(prId: number, agentName: string): Promise<void> {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
    });
    if (!review) {
      throw new Error('No review found for this PR');
    }

    // Delete existing findings for this agent
    await this.findingRepo.delete({
      reviewId: review.id,
      agentName,
    });

    // Re-run analysis
    const files = await this.reviewFileRepo.find({
      where: { pullRequestId: prId },
    });

    const agentMap = {
      style: this.styleAgent,
      bug: this.bugAgent,
      security: this.securityAgent,
      performance: this.performanceAgent,
    };

    const agent = agentMap[agentName];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    const fileFindings: Finding[] = [];

    for (const file of files) {
      const fileText = file.diffContent || '';
      const context = { reviewId: review.id, file };

      const agentFindings = await agent.analyze(fileText, file.filePath, context);

      for (const f of agentFindings) {
        const finding = this.findingRepo.create({
          reviewId: review.id,
          reviewFileId: file.id,
          agentName,
          ruleId: f.ruleId || null,
          severity: f.severity,
          message: f.message,
          suggestion: f.suggestion || null,
          lineStart: f.line,
          lineEnd: null,
          column: f.column || null,
          codeSnippet: null,
        });
        fileFindings.push(finding);
      }
    }

    if (fileFindings.length > 0) {
      await this.findingRepo.save(fileFindings);
    }

    // Update scores
    const severityWeights: Record<string, number> = {
      critical: 10,
      major: 5,
      minor: 2,
      info: 1,
    };
    const deduction = fileFindings.reduce(
      (sum, f) => sum + (severityWeights[f.severity] || 1),
      0,
    );
    const score = Math.max(0, 100 - deduction);

    const scoreField = `${agentName}Score` as keyof Review;
    (review as any)[scoreField] = score;

    // Recalculate overall
    const scores = [
      review.styleScore ?? 100,
      review.bugScore ?? 100,
      review.securityScore ?? 100,
      review.performanceScore ?? 100,
    ];
    review.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / 4);

    await this.reviewRepo.save(review);
  }
}
