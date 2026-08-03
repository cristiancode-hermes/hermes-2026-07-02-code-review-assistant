import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, PullRequest, Review, Finding, AgentProgress } from '../../services/api.service';
import { PrInfoHeaderComponent } from './pr-info-header.component';
import { ReviewProgressComponent } from './review-progress.component';
import { ScoreCardComponent, ScoreCategory } from './score-card.component';
import { FindingsByFileComponent } from './findings-by-file.component';
import { ExecutiveSummaryComponent } from './executive-summary.component';
import { FindingsFilterBarComponent } from './findings-filter-bar.component';
import { ButtonComponent } from '../../shared/button.component';
import { CardComponent } from '../../shared/card.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ErrorStateComponent } from '../../shared/error-state.component';

@Component({
  selector: 'app-pr-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    PrInfoHeaderComponent,
    ReviewProgressComponent,
    ScoreCardComponent,
    FindingsByFileComponent,
    ExecutiveSummaryComponent,
    FindingsFilterBarComponent,
    ButtonComponent,
    CardComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  template: `
<div class="space-y-6">
@if (loading()) {
<app-skeleton type="card" count="3" />
} @else if (error()) {
<app-error-state [message]="error()!" (retry)="loadData()" />
} @else {
@let pr = pullRequest();
<a [routerLink]="['/repositories', repoId()]" class="text-sm text-primary hover:text-primary-dark inline-block mb-2">
&larr; Back to repository
</a>

<app-pr-info-header [pr]="pr!" />

<!-- Review Controls -->
@if (review()?.status !== 'completed') {
<div class="flex gap-3">
<app-button
[loading]="triggeringReview()"
(handleClick)="triggerReview()"
[disabled]="review()?.status === 'in_progress'"
>
@if (review()?.status === 'in_progress') {
Review in Progress...
} @else if (review()?.status === 'failed') {
Retry Review
} @else {
Run Code Review
}
</app-button>
</div>
}

<!-- Review Progress -->
@if (agents().length > 0) {
<app-review-progress [agents]="agents()" />
}

<!-- Score Cards -->
@if (review()?.scores) {
@let scores = review()!.scores!;
<div>
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark mb-3">Scores</h2>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
<app-score-card category="style" [score]="scores.style" />
<app-score-card category="bug" [score]="scores.bug" />
<app-score-card category="security" [score]="scores.security" />
<app-score-card category="performance" [score]="scores.performance" />
</div>
</div>
}

<!-- Executive Summary -->
@if (review()?.summary) {
<app-executive-summary [summary]="review()!.summary" />
}

<!-- Findings -->
@if (allFindings().length > 0) {
<div>
<div class="flex items-center justify-between mb-3">
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark">Findings</h2>
<div class="flex items-center gap-3">
<span class="text-sm text-text-secondary dark:text-text-secondary-dark">{{ filteredFindings().length }} of {{ allFindings().length }}</span>
<button (click)="exportFindings()" class="inline-flex items-center gap-2 rounded-card border border-surface-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-text-primary dark:text-text-primary-dark hover:border-primary hover:text-primary transition-colors">
⬇️ Export CSV
</button>
</div>
</div>
<div class="mb-4">
<app-findings-filter-bar
[(selectedSeverity)]="severityFilter"
[(selectedCategory)]="categoryFilter"
(filterChange)="onFilterChange()"
/>
</div>
@if (filteredFindings().length === 0) {
<div class="text-center py-8 text-sm text-text-secondary dark:text-text-secondary-dark">
No findings match the current filters
</div>
} @else {
<app-findings-by-file [findings]="filteredFindings()" />
}
</div>
} @else if (review()?.status === 'completed') {
<app-card title="Findings">
<p class="text-sm text-text-secondary dark:text-text-secondary-dark text-center py-4">No issues found. Great code!</p>
</app-card>
}
}
</div>
`,
})
export class PrDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  protected repoId = signal('');
  protected prId = signal('');
  protected pullRequest = signal<PullRequest | null>(null);
  protected review = signal<Review | null>(null);
  protected allFindings = signal<Finding[]>([]);
  protected agents = signal<AgentProgress[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected triggeringReview = signal(false);
  protected severityFilter = signal('');
  protected categoryFilter = signal('');

  constructor() {
    this.repoId.set(this.route.snapshot.paramMap.get('repoId') ?? '');
    this.prId.set(this.route.snapshot.paramMap.get('prId') ?? '');
    if (this.repoId() && this.prId()) this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPullRequest(this.repoId(), this.prId()).subscribe({
      next: (pr) => {
        this.pullRequest.set(pr);
        this.loadReview();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load PR');
        this.loading.set(false);
      },
    });
  }

  protected loadReview(): void {
    this.api.getReview(this.repoId(), this.prId()).subscribe({
      next: (review) => {
        this.review.set(review);
        this.allFindings.set(review.findings || []);
        this.agents.set(review.agents || []);
        this.loading.set(false);
      },
      error: () => {
        // No review yet is okay
        this.loading.set(false);
      },
    });
  }

  protected triggerReview(): void {
    this.triggeringReview.set(true);
    this.api.triggerReview(this.repoId(), this.prId()).subscribe({
      next: (review) => {
        this.review.set(review);
        this.agents.set(review.agents || []);
        this.triggeringReview.set(false);
        this.pollProgress();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to trigger review');
        this.triggeringReview.set(false);
      },
    });
  }

  private pollProgress(): void {
    const interval = setInterval(() => {
      this.api.getReviewProgress(this.repoId(), this.prId()).subscribe({
        next: (agents) => {
          this.agents.set(agents);
          const allDone = agents.every(
            (a) => a.status === 'completed' || a.status === 'failed'
          );
          if (allDone) {
            clearInterval(interval);
            this.loadReview();
          }
        },
        error: () => clearInterval(interval),
      });
    }, 3000);
  }

  protected filteredFindings = computed(() => {
    let f = this.allFindings();
    const sev = this.severityFilter();
    const cat = this.categoryFilter();
    if (sev) f = f.filter((x) => x.severity === sev);
    if (cat) f = f.filter((x) => x.category === cat);
    return f;
  });

  protected onFilterChange(): void {
    // Triggered by filter changes, computed auto-updates
  }

  protected exportFindings(): void {
    const sev = this.severityFilter();
    const cat = this.categoryFilter();
    const url = this.api.getFindingsExportUrl(this.repoId(), this.prId(), { severity: sev, category: cat });
    window.open(url, '_blank');
  }
}
