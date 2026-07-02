import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
      @if (title() || subtitle()) {
        <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          @if (title()) {
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{{ subtitle() }}</p>
          }
        </div>
      }
      <div class="p-5">
        <ng-content />
      </div>
    </div>
  `,
})
export class CardComponent {
  readonly title = input('');
  readonly subtitle = input('');
}
