import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PullRequest } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-pr-info-header',
  standalone: true,
  imports: [DatePipe, BadgeComponent],
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" [class]="pr().status === 'open' ? 'text-success' : pr().status === 'merged' ? 'text-secondary' : 'text-neutral-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h1 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate">{{ pr().title }}</h1>
            <app-badge [text]="'#' + pr().number" variant="info" size="sm" />
          </div>
          <div class="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
            <span>By <strong class="text-neutral-700 dark:text-neutral-300">{{ pr().author }}</strong></span>
            <span>{{ pr().sourceBranch }} → {{ pr().targetBranch }}</span>
            <span>Created {{ pr().createdAt | date:'medium' }}</span>
          </div>
        </div>
        <app-badge
          [text]="pr().status"
          [variant]="pr().status === 'open' ? 'success' : pr().status === 'merged' ? 'secondary' : 'info'"
          size="md"
        />
      </div>
      @if (pr().description) {
        <p class="mt-4 text-sm text-neutral-600 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-4">
          {{ pr().description }}
        </p>
      }
    </div>
  `,
})
export class PrInfoHeaderComponent {
  readonly pr = input.required<PullRequest>();
}
