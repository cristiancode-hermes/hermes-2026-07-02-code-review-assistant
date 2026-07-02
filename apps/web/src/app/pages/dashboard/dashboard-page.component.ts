import { Component, inject, signal, computed } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ApiService, DashboardStats } from '../../services/api.service';
import { KpiCardComponent } from './kpi-card.component';
import { RecentReviewsListComponent } from './recent-reviews-list.component';
import { CardComponent } from '../../shared/card.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    SlicePipe,
    KpiCardComponent,
    RecentReviewsListComponent,
    CardComponent,
    SkeletonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <p class="text-neutral-500 dark:text-neutral-400 mt-1">Overview of your code review activity</p>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-28 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
          }
        </div>
        <app-skeleton type="card" count="3" />
      } @else if (error()) {
        <app-error-state [message]="error()!" (retry)="loadStats()" />
      } @else {
        @let stats = data();
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <app-kpi-card label="Repositories" [value]="stats?.totalRepositories ?? 0" color="primary">
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </app-kpi-card>
          <app-kpi-card label="Pull Requests" [value]="stats?.totalPullRequests ?? 0" color="secondary">
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </app-kpi-card>
          <app-kpi-card label="Issues Found" [value]="stats?.totalIssues ?? 0" color="danger">
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </app-kpi-card>
          <app-kpi-card label="Avg Score" [value]="(stats?.averageScore ?? 0) + '%'" color="success">
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </app-kpi-card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Reviews -->
          <app-card title="Recent Reviews" subtitle="Latest code review activity">
            @if (!stats?.recentReviews || stats!.recentReviews.length === 0) {
              <app-empty-state
                title="No reviews yet"
                message="Start by connecting a repository and creating a pull request."
              />
            } @else {
              <app-recent-reviews-list [reviews]="stats!.recentReviews" />
            }
          </app-card>

          <!-- Scores by Category -->
          <app-card title="Scores by Category" subtitle="Average scores across all reviews">
            @if (!stats?.scoreByCategory || stats!.scoreByCategory.length === 0) {
              <p class="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">No score data available yet</p>
            } @else {
              <div class="space-y-3">
                @for (item of stats!.scoreByCategory; track item.category) {
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-neutral-700 dark:text-neutral-300 capitalize">{{ item.category }}</span>
                      <span class="font-medium" [class]="scoreColor(item.score)">{{ item.score }}%</span>
                    </div>
                    <div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [style.width.%]="item.score"
                        [class]="scoreBarColor(item.score)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            }
          </app-card>
        </div>

        <!-- Activity Chart -->
        <app-card title="Activity" subtitle="Reviews over time">
          @if (!stats?.activityData || stats!.activityData.length === 0) {
            <p class="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">No activity data yet</p>
          } @else {
            <div class="flex items-end gap-2 h-32">
              @for (day of stats!.activityData; track day.date) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div
                    class="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors min-h-[4px]"
                    [style.height.%]="maxActivity() > 0 ? (day.reviews / maxActivity()) * 100 : 4"
                  ></div>
                  <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ day.date | slice:5:10 }}</span>
                </div>
              }
            </div>
          }
        </app-card>
      }
    </div>
  `,
})
export class DashboardPageComponent {
  private readonly api = inject(ApiService);

  protected data = signal<DashboardStats | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  constructor() {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDashboardStats().subscribe({
      next: (stats) => {
        this.data.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load dashboard');
        this.loading.set(false);
      },
    });
  }

  protected maxActivity = computed(() => {
    const d = this.data();
    if (!d?.activityData || d.activityData.length === 0) return 1;
    return Math.max(...d.activityData.map((a) => a.reviews));
  });

  protected scoreColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }

  protected scoreBarColor(score: number): string {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-danger';
  }
}
