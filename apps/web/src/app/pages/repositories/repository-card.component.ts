import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Repository } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-repository-card',
  standalone: true,
  imports: [RouterLink, DatePipe, BadgeComponent],
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div class="min-w-0">
            <a [routerLink]="['/repositories', repo().id]" class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary truncate block">
              {{ repo().name }}
            </a>
            @if (repo().description) {
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{{ repo().description }}</p>
            }
          </div>
        </div>
        <app-badge [text]="repo().language || 'N/A'" variant="info" size="sm" />
      </div>
      <div class="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ repo().prCount ?? 0 }} PRs
        </span>
        <span>{{ repo().defaultBranch }}</span>
        <span class="ml-auto">{{ repo().updatedAt | date:'mediumDate' }}</span>
      </div>
    </div>
  `,
})
export class RepositoryCardComponent {
  readonly repo = input.required<Repository>();
}
