import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Review } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-review-history-row',
  standalone: true,
  imports: [RouterLink, DatePipe, BadgeComponent],
  template: `
    <a
      [routerLink]="['/repositories', review().prId, 'prs', review().prId]"
      class="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
    >
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {{ review().prTitle }}
        </p>
        <div class="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{{ review().repositoryName }}</span>
          <span>{{ review().createdAt | date:'medium' }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-4">
        @if (review().scores) {
          <app-badge [text]="review().scores!.overall + '%'" variant="success" size="sm" />
        }
        <app-badge
          [text]="review().status"
          [variant]="review().status === 'completed' ? 'success' : review().status === 'failed' ? 'danger' : 'warning'"
          size="sm"
        />
      </div>
    </a>
  `,
})
export class ReviewHistoryRowComponent {
  readonly review = input.required<Review>();
}
