import { Component, input } from '@angular/core';

@Component({
  selector: 'app-executive-summary',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Executive Summary</h3>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{{ summary() }}</p>
    </div>
  `,
})
export class ExecutiveSummaryComponent {
  readonly summary = input('');
}
