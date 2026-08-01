import { Component, inject, signal } from '@angular/core';
import { ApiService, Review } from '../../services/api.service';
import { ReviewHistoryRowComponent } from './review-history-row.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SearchBarComponent } from '../../shared/search-bar.component';

@Component({
  selector: 'app-review-history-page',
  standalone: true,
  imports: [
    ReviewHistoryRowComponent,
    SkeletonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SearchBarComponent,
  ],
  template: `
<div class="space-y-6">
<div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Review History</h1>
<p class="text-text-secondary dark:text-text-secondary-dark mt-1">All your past code reviews</p>
</div>

<app-search-bar
placeholder="Search reviews..."
[(query)]="searchQuery"
(search)="onSearch($event)"
/>

@if (loading()) {
<app-skeleton type="row" count="5" />
} @else if (error()) {
<app-error-state [message]="error()!" (retry)="loadHistory()" />
} @else if (filteredReviews().length === 0) {
@if (searchQuery()) {
<app-empty-state
title="No reviews found"
[message]="'No reviews match &quot;' + searchQuery() + '&quot;'"
/>
} @else {
<app-empty-state
title="No reviews yet"
message="Reviews will appear here once you start analyzing pull requests."
/>
}
} @else {
<div class="space-y-2">
@for (review of filteredReviews(); track review.id) {
<app-review-history-row [review]="review" />
}
</div>
}
</div>
`,
})
export class ReviewHistoryPageComponent {
  private readonly api = inject(ApiService);

  protected reviews = signal<Review[]>([]);
  protected searchQuery = signal('');
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  constructor() {
    this.loadHistory();
  }

  protected loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getReviewHistory({ limit: 50 }).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load review history');
        this.loading.set(false);
      },
    });
  }

  protected filteredReviews = () => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.reviews();
    return this.reviews().filter(
      (r) =>
        r.prTitle.toLowerCase().includes(q) ||
        r.repositoryName.toLowerCase().includes(q)
    );
  };

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}
