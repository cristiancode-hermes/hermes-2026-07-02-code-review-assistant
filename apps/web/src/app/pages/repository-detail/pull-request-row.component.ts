import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PullRequest } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-pull-request-row',
  standalone: true,
  imports: [RouterLink, DatePipe, BadgeComponent],
  template: `
<a
[routerLink]="['/repositories', repoId(), 'prs', pr().id]"
class="flex items-center justify-between p-4 bg-surface-card dark:bg-neutral-800 rounded-btn border border-border dark:border-neutral-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
>
<div class="flex-1 min-w-0">
<div class="flex items-center gap-2">
<svg class="w-4 h-4 flex-shrink-0" [class]="pr().status === 'open' ? 'text-success' : pr().status === 'merged' ? 'text-secondary' : 'text-text-secondary-dark'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
</svg>
<span class="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate">{{ pr().title }}</span>
<app-badge [text]="'#' + pr().number" variant="info" size="sm" />
</div>
<div class="flex items-center gap-3 mt-1 text-xs text-text-secondary dark:text-text-secondary-dark">
<span>{{ pr().author }}</span>
<span>{{ pr().sourceBranch }} → {{ pr().targetBranch }}</span>
<span>{{ pr().createdAt | date:'mediumDate' }}</span>
</div>
</div>
<div class="flex items-center gap-2 ml-4">
@if (pr().scores) {
<app-badge [text]="pr().scores!.overall + '%'" variant="success" size="sm" />
}
<app-badge
[text]="pr().status"
[variant]="pr().status === 'open' ? 'success' : pr().status === 'merged' ? 'secondary' : 'info'"
size="sm"
/>
</div>
</a>
`,
})
export class PullRequestRowComponent {
  readonly repoId = input<string>('');
  readonly pr = input.required<PullRequest>();
}
