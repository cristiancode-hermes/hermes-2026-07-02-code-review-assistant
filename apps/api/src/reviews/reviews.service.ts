import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../common/entities/review.entity';
import { Finding } from '../common/entities/finding.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { PullRequest } from '../common/entities/pull-request.entity';
import { AgentCoordinatorService } from '../agents/agent-coordinator.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(Finding)
    private findingRepo: Repository<Finding>,
    @InjectRepository(ReviewFile)
    private reviewFileRepo: Repository<ReviewFile>,
    @InjectRepository(PullRequest)
    private prRepo: Repository<PullRequest>,
    private coordinator: AgentCoordinatorService,
  ) {}

  async runReview(prId: number) {
    const pr = await this.prRepo.findOne({ where: { id: prId } });
    if (!pr) {
      // Create some mock review files for the demo
      const mockFiles = this.getMockFilesForPR(prId);
      for (const file of mockFiles) {
        await this.reviewFileRepo.save(file);
      }
    }

    return this.coordinator.runReview(prId);
  }

  async getReview(prId: number) {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
      relations: { findings: true, pullRequest: true },
    });
    if (!review) throw new NotFoundException('Review not found for this PR');
    return review;
  }

  async getStream(prId: number) {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
    });
    if (!review) throw new NotFoundException('Review not found for this PR');
    return { status: review.status, reviewId: review.id };
  }

  async rerunAgent(prId: number, agentName: string) {
    await this.coordinator.rerunAgent(prId, agentName);
    return this.getReview(prId);
  }

  async getSummary(prId: number) {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
    });
    if (!review) throw new NotFoundException('Review not found for this PR');

    const findings = await this.findingRepo.find({
      where: { reviewId: review.id },
    });

    const categories = {
      style: { total: 0, critical: 0, major: 0, minor: 0, info: 0 },
      bug: { total: 0, critical: 0, major: 0, minor: 0, info: 0 },
      security: { total: 0, critical: 0, major: 0, minor: 0, info: 0 },
      performance: { total: 0, critical: 0, major: 0, minor: 0, info: 0 },
    };

    for (const f of findings) {
      const cat = categories[f.agentName];
      if (cat) {
        cat.total++;
        cat[f.severity]++;
      }
    }

    return {
      reviewId: review.id,
      status: review.status,
      overallScore: review.overallScore,
      scores: {
        style: review.styleScore,
        bug: review.bugScore,
        security: review.securityScore,
        performance: review.performanceScore,
      },
      totalFindings: findings.length,
      categories,
      executiveSummary: review.executiveSummary,
      completedAt: review.completedAt,
    };
  }

  async getFindings(
    prId: number,
    filters: { severity?: string; category?: string; file?: string },
  ) {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
    });
    if (!review) throw new NotFoundException('Review not found for this PR');

    const query: any = { reviewId: review.id };
    if (filters.severity) query.severity = filters.severity;
    if (filters.category) query.agentName = filters.category;
    if (filters.file) {
      const file = await this.reviewFileRepo.findOne({
        where: { filePath: filters.file, pullRequestId: prId },
      });
      if (file) query.reviewFileId = file.id;
    }

    return this.findingRepo.find({
      where: query,
      relations: { reviewFile: true },
      order: { severity: 'ASC', createdAt: 'DESC' },
    });
  }

  async getFinding(prId: number, findingId: number) {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
    });
    if (!review) throw new NotFoundException('Review not found');

    const finding = await this.findingRepo.findOne({
      where: { id: findingId, reviewId: review.id },
      relations: { reviewFile: true },
    });
    if (!finding) throw new NotFoundException('Finding not found');
    return finding;
  }

  async getFindingsStats(prId: number) {
    const review = await this.reviewRepo.findOne({
      where: { pullRequestId: prId },
    });
    if (!review) throw new NotFoundException('Review not found');

    const findings = await this.findingRepo.find({
      where: { reviewId: review.id },
    });

    const severityCount = { critical: 0, major: 0, minor: 0, info: 0 };
    const categoryCount: Record<string, number> = {};

    for (const f of findings) {
      severityCount[f.severity]++;
      categoryCount[f.agentName] = (categoryCount[f.agentName] || 0) + 1;
    }

    return { total: findings.length, severity: severityCount, categories: categoryCount };
  }

  private getMockFilesForPR(prId: number): Partial<ReviewFile>[] {
    return [
      {
        pullRequestId: prId,
        filePath: 'src/app.component.ts',
        status: 'modified',
        additions: 45,
        deletions: 12,
        diffContent: `import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'code-review-app';
  data: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    var results = [];
    for (var i = 0; i < 100; i++) {
      results.push(i);
    }
    // TODO: implement proper error handling
    this.http.get('/api/data').subscribe(res => {
      this.data = res;
    });
  }

  processItems(items: any[]) {
    var filtered = items.filter(x => x.active).map(x => x.name);
    document.getElementById('output').innerHTML = filtered.join(', ');
    return filtered;
  }
}`,
      },
      {
        pullRequestId: prId,
        filePath: 'src/utils/helpers.ts',
        status: 'added',
        additions: 80,
        deletions: 0,
        diffContent: `export function calculateTotal(prices, taxRate) {
  var total = 0;
  for (var i = 0; i < prices.length; i++) {
    total += prices[i];
  }
  return total * (1 + taxRate);
}

export function sanitizeInput(input) {
  eval(input);
  return input;
}

export function getUserData(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  return executeQuery(query);
}`,
      },
      {
        pullRequestId: prId,
        filePath: 'src/config/api.config.ts',
        status: 'modified',
        additions: 5,
        deletions: 3,
        diffContent: `export const API_CONFIG = {
  baseUrl: 'https://api.example.com',
  apiKey: 'sk-1234567890abcdef',
  timeout: 5000,
};`,
      },
    ];
  }
}
