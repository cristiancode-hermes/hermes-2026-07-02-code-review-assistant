import { Component, input, numberAttribute } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="animate-pulse space-y-3">
      @if (type() === 'card') {
        @for (item of items; track $index) {
          <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
            <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
            <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
          </div>
        }
      } @else if (type() === 'row') {
        @for (item of items; track $index) {
          <div class="flex items-center gap-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div class="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
              <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
            </div>
          </div>
        }
      } @else if (type() === 'chart') {
        <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-6"></div>
          <div class="h-40 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      } @else {
        @for (item of items; track $index) {
          <div class="space-y-2">
            <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
            <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
            <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
          </div>
        }
      }
    </div>
  `,
})
export class SkeletonComponent {
  readonly type = input<'card' | 'row' | 'text' | 'chart'>('text');
  readonly count = input(1, { transform: numberAttribute });

  protected get items(): number[] {
    return Array.from({ length: Math.max(1, this.count()) }, (_, i) => i);
  }
}
