import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-recent-reviews-list',
  standalone: true,
  imports: [RouterLink, BadgeComponent],
  template: `
<div class="space-y-2">
@for (review of reviews(); track review.id) {
<a
[routerLink]="['/repositories', review.prId, 'prs', review.prId]"
class="flex items-center justify-between p-3 rounded-btn hover:bg-surface dark:hover:bg-neutral-700/50 transition-colors"
>
<div class="flex-1 min-w-0">
<p class="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate">
{{ review.prTitle }}
</p>
<p class="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
{{ review.repositoryName }}
</p>
</div>
<div class="flex items-center gap-2 ml-4">
<app-badge
[text]="review.status === 'completed' ? (review.scores?.overall ?? 0) + '%' : review.status"
[variant]="review.status === 'completed' ? 'success' : review.status === 'in_progress' ? 'warning' : review.status === 'failed' ? 'danger' : 'info'"
/>
</div>
</a>
}
</div>
`,
})
export class RecentReviewsListComponent {
  readonly reviews = input<Review[]>([]);
}
