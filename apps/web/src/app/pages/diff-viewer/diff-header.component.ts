import { Component, input } from '@angular/core';
import { DiffFile } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-diff-header',
  standalone: true,
  imports: [BadgeComponent],
  template: `
<div class="bg-surface-card dark:bg-neutral-800 rounded-card border border-border dark:border-neutral-700 p-4">
<div class="flex items-center justify-between">
<div class="flex items-center gap-3 min-w-0">
<svg class="w-5 h-5 flex-shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>
<span class="text-sm font-medium text-text-primary dark:text-text-primary-dark font-mono truncate">{{ file().fileName }}</span>
<app-badge [text]="file().status" [variant]="file().status === 'added' ? 'success' : file().status === 'removed' ? 'danger' : 'warning'" size="sm" />
</div>
<div class="flex items-center gap-3 text-xs text-text-secondary dark:text-text-secondary-dark">
<span class="text-success">+{{ file().additions }}</span>
<span class="text-danger">-{{ file().deletions }}</span>
</div>
</div>
@if (file().oldFileName && file().oldFileName !== file().fileName) {
<p class="text-xs text-text-secondary dark:text-text-secondary-dark mt-2 font-mono">
Renamed from {{ file().oldFileName }}
</p>
}
</div>
`,
})
export class DiffHeaderComponent {
  readonly file = input.required<DiffFile>();
}
