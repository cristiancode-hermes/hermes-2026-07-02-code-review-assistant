import { Component, input } from '@angular/core';

@Component({
  selector: 'app-executive-summary',
  standalone: true,
  template: `
<div class="bg-surface-card dark:bg-neutral-800 rounded-card border border-border dark:border-neutral-700 p-5">
<h3 class="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-3">Executive Summary</h3>
<p class="text-sm text-neutral-600 dark:text-text-secondary-dark leading-relaxed">{{ summary() }}</p>
</div>
`,
})
export class ExecutiveSummaryComponent {
  readonly summary = input('');
}
