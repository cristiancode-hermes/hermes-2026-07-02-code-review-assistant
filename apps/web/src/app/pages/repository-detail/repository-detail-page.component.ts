import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Repository, PullRequest } from '../../services/api.service';
import { PullRequestRowComponent } from './pull-request-row.component';
import { CreatePrModalComponent } from './create-pr-modal.component';
import { ButtonComponent } from '../../shared/button.component';
import { BadgeComponent } from '../../shared/badge.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';

@Component({
  selector: 'app-repository-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    PullRequestRowComponent,
    CreatePrModalComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <app-skeleton type="card" count="2" />
        <app-skeleton type="row" count="3" />
      } @else if (error()) {
        <app-error-state [message]="error()!" (retry)="loadData()" />
      } @else {
        @let repo = repository();
        <div class="flex items-center justify-between">
          <div>
            <a routerLink="/repositories" class="text-sm text-primary hover:text-primary-dark mb-1 inline-block">
              &larr; Repositories
            </a>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ repo?.name }}</h1>
              <app-badge [text]="repo?.language || 'N/A'" variant="info" size="sm" />
              @if (repo?.private) {
                <app-badge text="Private" variant="warning" size="sm" />
              }
            </div>
            @if (repo?.description) {
              <p class="text-neutral-500 dark:text-neutral-400 mt-1">{{ repo?.description }}</p>
            }
          </div>
          <app-button (handleClick)="showCreatePr.set(true)">
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New PR
          </app-button>
        </div>

        <!-- Pull Requests -->
        <div>
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Pull Requests</h2>
          @if (prs().length === 0) {
            <app-empty-state
              title="No pull requests"
              message="Create your first pull request to start getting code reviews."
              actionLabel="New Pull Request"
              (action)="showCreatePr.set(true)"
            />
          } @else {
            <div class="space-y-2">
              @for (pr of prs(); track pr.id) {
                <app-pull-request-row [pr]="pr" [repoId]="repoId()" />
              }
            </div>
          }
        </div>
      }
    </div>

    <app-create-pr-modal
      [open]="showCreatePr()"
      [repoId]="repoId()"
      (close)="showCreatePr.set(false)"
      (created)="loadPrs()"
    />
  `,
})
export class RepositoryDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  protected repoId = signal('');
  protected repository = signal<Repository | null>(null);
  protected prs = signal<PullRequest[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected showCreatePr = signal(false);

  constructor() {
    this.repoId.set(this.route.snapshot.paramMap.get('id') ?? '');
    if (this.repoId()) this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getRepository(this.repoId()).subscribe({
      next: (repo) => {
        this.repository.set(repo);
        this.loadPrs();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load repository');
        this.loading.set(false);
      },
    });
  }

  protected loadPrs(): void {
    this.api.getPullRequests(this.repoId()).subscribe({
      next: (prs) => {
        this.prs.set(prs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load pull requests');
        this.loading.set(false);
      },
    });
  }
}
