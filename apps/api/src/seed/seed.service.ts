import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../common/entities/user.entity';
import { UserPreference } from '../common/entities/user-preference.entity';
import { Repository as RepoEntity } from '../common/entities/repository.entity';
import { PullRequest } from '../common/entities/pull-request.entity';
import { Review } from '../common/entities/review.entity';
import { ReviewFile } from '../common/entities/review-file.entity';
import { Finding } from '../common/entities/finding.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserPreference)
    private prefRepo: Repository<UserPreference>,
    @InjectRepository(RepoEntity)
    private repoRepo: Repository<RepoEntity>,
    @InjectRepository(PullRequest)
    private prRepo: Repository<PullRequest>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ReviewFile)
    private reviewFileRepo: Repository<ReviewFile>,
    @InjectRepository(Finding)
    private findingRepo: Repository<Finding>,
  ) {}

  async onModuleInit() {
    // Check if data already exists (idempotent seeding)
    const existingUsers = await this.userRepo.count();
    if (existingUsers > 0) {
      this.logger.log(`Seed skipped: ${existingUsers} users already exist`);
      return;
    }

    this.logger.log('Seeding database...');

    // Create users
    const hash = await bcrypt.hash('demo1234', 10);
    const ana = await this.userRepo.save(
      this.userRepo.create({ name: 'Ana Silva', email: 'ana@devcorp.com', passwordHash: hash }),
    );
    const carlos = await this.userRepo.save(
      this.userRepo.create({ name: 'Carlos Mendoza', email: 'carlos@devcorp.com', passwordHash: hash }),
    );

    // Create preferences
    await this.prefRepo.save(this.prefRepo.create({ userId: ana.id }));
    await this.prefRepo.save(this.prefRepo.create({ userId: carlos.id }));

    // Create repositories
    const frontendRepo = await this.repoRepo.save(
      this.repoRepo.create({
        userId: ana.id,
        name: 'frontend-app',
        localPath: '/repos/frontend-app',
        defaultBranch: 'main',
      }),
    );
    const backendRepo = await this.repoRepo.save(
      this.repoRepo.create({
        userId: ana.id,
        name: 'backend-api',
        localPath: '/repos/backend-api',
        defaultBranch: 'main',
      }),
    );
    const authRepo = await this.repoRepo.save(
      this.repoRepo.create({
        userId: carlos.id,
        name: 'auth-module',
        localPath: '/repos/auth-module',
        defaultBranch: 'develop',
      }),
    );

    // Create Pull Requests
    const pr1 = await this.prRepo.save(
      this.prRepo.create({
        repositoryId: frontendRepo.id,
        userId: ana.id,
        title: 'Refactor dashboard component and add unit tests',
        description:
          'Complete refactor of the main dashboard component to improve performance and testability. Extracted inline styles, reduced component complexity, and added Jest unit tests covering all states.',
        baseBranch: 'main',
        sourceBranch: 'feature/dashboard-refactor',
        status: 'closed',
      }),
    );

    const pr2 = await this.prRepo.save(
      this.prRepo.create({
        repositoryId: backendRepo.id,
        userId: ana.id,
        title: 'Add user management endpoints and input validation',
        description:
          'Implemented CRUD endpoints for user management, added Joi validation schemas, improved error handling middleware, and updated API documentation.',
        baseBranch: 'main',
        sourceBranch: 'feature/user-management',
        status: 'open',
      }),
    );

    const pr3 = await this.prRepo.save(
      this.prRepo.create({
        repositoryId: authRepo.id,
        userId: carlos.id,
        title: 'Implement OAuth2 integration with Google and GitHub',
        description:
          'Added OAuth2 authentication flow supporting Google and GitHub providers. Includes token refresh, session management, and database migration for provider accounts.',
        baseBranch: 'develop',
        sourceBranch: 'feature/oauth-integration',
        status: 'open',
      }),
    );

    // Create Review Files for PR1
    const file1 = await this.reviewFileRepo.save(
      this.reviewFileRepo.create({
        pullRequestId: pr1.id,
        filePath: 'src/app/dashboard/dashboard.component.ts',
        status: 'modified',
        additions: 120,
        deletions: 85,
        diffContent: `import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  metrics: any[] = [];
  private subscription: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.subscription = this.dashboardService.getMetrics().subscribe(data => {
      this.metrics = data;
    });

    // TODO: add error handling for failed API calls
    var element = document.getElementById('loading');
    if (element) {
      element.innerHTML = 'Loading complete';
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  processMetrics(items: any[]) {
    var results = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].active == true) {
        results.push(items[i].value);
      }
    }
    document.body.style.backgroundColor = 'white';
    return results;
  }
}`,
      }),
    );

    await this.reviewFileRepo.save(
      this.reviewFileRepo.create({
        pullRequestId: pr1.id,
        filePath: 'src/app/dashboard/dashboard.component.html',
        status: 'modified',
        additions: 30,
        deletions: 20,
        diffContent: `<div class="dashboard">
  <h1>Dashboard</h1>
  <div class="metrics-grid">
    <div *ngFor="let metric of metrics" class="metric-card">
      <h3>{{ metric.label }}</h3>
      <p class="value">{{ metric.value }}</p>
    </div>
  </div>
</div>`,
      }),
    );

    await this.reviewFileRepo.save(
      this.reviewFileRepo.create({
        pullRequestId: pr1.id,
        filePath: 'src/app/dashboard/dashboard.service.ts',
        status: 'added',
        additions: 25,
        deletions: 0,
        diffContent: `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'https://api.example.com/dashboard';
  private apiKey = 'sk-...secret...';

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}`,
      }),
    );

    // Create Review Files for PR2
    await this.reviewFileRepo.save(
      this.reviewFileRepo.create({
        pullRequestId: pr2.id,
        filePath: 'src/users/users.controller.ts',
        status: 'added',
        additions: 65,
        deletions: 0,
        diffContent: `import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    const query = "SELECT * FROM users";
    return this.usersService.executeQuery(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const query = "SELECT * FROM users WHERE id = " + id;
    return this.usersService.executeQuery(query);
  }

  @Post()
  async create(@Body() body: any) {
    eval(body.script);
    return this.usersService.create(body);
  }
}`,
      }),
    );

    await this.reviewFileRepo.save(
      this.reviewFileRepo.create({
        pullRequestId: pr2.id,
        filePath: 'src/users/users.service.ts',
        status: 'modified',
        additions: 40,
        deletions: 15,
        diffContent: `import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async executeQuery(query: string) {
    return this.userRepo.query(query);
  }

  async create(data: any) {
    return this.userRepo.save(data);
  }
}`,
      }),
    );

    // Create completed reviews for PR1
    const review1 = await this.reviewRepo.save(
      this.reviewRepo.create({
        pullRequestId: pr1.id,
        status: 'completed',
        styleScore: 72,
        bugScore: 85,
        securityScore: 45,
        performanceScore: 68,
        overallScore: 68,
        executiveSummary:
          'Found 12 issues: 2 critical security, 3 major, 5 minor, 2 info. Dashboard component has hardcoded credentials and uses innerHTML. Style improvements recommended.',
        completedAt: new Date('2026-06-28'),
      }),
    );

    // Add findings for PR1 review
    const review1Findings = [
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'style',
        ruleId: 'STYLE-003',
        severity: 'minor',
        message: 'Missing semicolon at end of statement.',
        suggestion: 'Add semicolon.',
        lineStart: 18,
        column: 45,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'style',
        ruleId: 'STYLE-004',
        severity: 'info',
        message: 'Found "TODO" comment. This indicates incomplete work.',
        suggestion: 'Address the TODO item or create a task.',
        lineStart: 17,
        column: 5,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'style',
        ruleId: 'STYLE-001',
        severity: 'major',
        message: 'Function is too long (65 lines). Consider refactoring.',
        suggestion: 'Break down into smaller functions.',
        lineStart: 25,
        column: 1,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'bug',
        ruleId: 'BUG-001',
        severity: 'major',
        message: 'Using loose equality (==) instead of strict equality (===).',
        suggestion: 'Replace == with ===.',
        lineStart: 43,
        column: 30,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'bug',
        ruleId: 'BUG-002',
        severity: 'major',
        message: 'Using "var" declaration. Prefer "const" or "let".',
        suggestion: 'Replace var with const or let.',
        lineStart: 38,
        column: 5,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'security',
        ruleId: 'SEC-001',
        severity: 'critical',
        message: 'Using innerHTML exposes to XSS attacks.',
        suggestion: 'Use textContent or safe DOM methods.',
        lineStart: 20,
        column: 14,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'security',
        ruleId: 'SEC-004',
        severity: 'critical',
        message: 'Potential hardcoded credential detected (apiKey).',
        suggestion: 'Use environment variables.',
        lineStart: 7,
        column: 21,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'security',
        ruleId: 'SEC-006',
        severity: 'major',
        message: 'URL with hardcoded credential pattern.',
        suggestion: 'Use environment variables.',
        lineStart: 6,
        column: 22,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'performance',
        ruleId: 'PERF-001',
        severity: 'major',
        message: 'Modifying element styles directly causes layout thrashing.',
        suggestion: 'Use CSS classes instead.',
        lineStart: 48,
        column: 5,
      },
      {
        reviewId: review1.id,
        reviewFileId: file1.id,
        agentName: 'performance',
        ruleId: 'PERF-004',
        severity: 'minor',
        message: 'Inefficient loop - using for with var instead of forEach.',
        suggestion: 'Use forEach or for...of.',
        lineStart: 39,
        column: 5,
      },
    ];

    for (const f of review1Findings) {
      await this.findingRepo.save(this.findingRepo.create(f));
    }

    // Create review for PR2
    const review2 = await this.reviewRepo.save(
      this.reviewRepo.create({
        pullRequestId: pr2.id,
        status: 'completed',
        styleScore: 65,
        bugScore: 40,
        securityScore: 15,
        performanceScore: 80,
        overallScore: 50,
        executiveSummary:
          'Found 8 issues: 3 critical security (SQL injection, eval), 2 major, 2 minor, 1 info. Critical security vulnerabilities must be addressed before deployment.',
        completedAt: new Date('2026-06-29'),
      }),
    );

    // Add findings for PR2 review
    const file2_1 = await this.reviewFileRepo.findOne({
      where: { pullRequestId: pr2.id, filePath: 'src/users/users.controller.ts' },
    });

    if (file2_1) {
      const review2Findings = [
        {
          reviewId: review2.id,
          reviewFileId: file2_1.id,
          agentName: 'style',
          ruleId: 'STYLE-003',
          severity: 'minor',
          message: 'Missing semicolon at end of statement.',
          suggestion: 'Add semicolon.',
          lineStart: 22,
          column: 35,
        },
        {
          reviewId: review2.id,
          reviewFileId: file2_1.id,
          agentName: 'bug',
          ruleId: 'BUG-002',
          severity: 'minor',
          message: 'Using "var" declaration where const/let is preferred.',
          suggestion: 'Replace var with const or let.',
          lineStart: 24,
          column: 5,
        },
        {
          reviewId: review2.id,
          reviewFileId: file2_1.id,
          agentName: 'security',
          ruleId: 'SEC-005',
          severity: 'critical',
          message: 'Possible SQL injection via string concatenation.',
          suggestion: 'Use parameterized queries.',
          lineStart: 11,
          column: 47,
        },
        {
          reviewId: review2.id,
          reviewFileId: file2_1.id,
          agentName: 'security',
          ruleId: 'SEC-005',
          severity: 'critical',
          message: 'Possible SQL injection via string concatenation.',
          suggestion: 'Use parameterized queries.',
          lineStart: 18,
          column: 47,
        },
        {
          reviewId: review2.id,
          reviewFileId: file2_1.id,
          agentName: 'security',
          ruleId: 'SEC-002',
          severity: 'critical',
          message: 'Using eval() is dangerous and exposes to code injection.',
          suggestion: 'Avoid eval() entirely.',
          lineStart: 26,
          column: 5,
        },
        {
          reviewId: review2.id,
          reviewFileId: file2_1.id,
          agentName: 'performance',
          ruleId: 'PERF-005',
          severity: 'info',
          message: 'Endpoint returns all users without pagination.',
          suggestion: 'Add pagination support.',
          lineStart: 10,
          column: 1,
        },
      ];

      for (const f of review2Findings) {
        await this.findingRepo.save(this.findingRepo.create(f));
      }
    }

    // Create pending review for PR3
    await this.reviewRepo.save(
      this.reviewRepo.create({
        pullRequestId: pr3.id,
        status: 'pending',
        styleScore: null,
        bugScore: null,
        securityScore: null,
        performanceScore: null,
        overallScore: null,
        executiveSummary: null,
        completedAt: null,
      }),
    );

    this.logger.log('Database seeding completed successfully');
  }
}
