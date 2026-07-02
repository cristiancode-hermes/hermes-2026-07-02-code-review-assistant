import { Component, model, output } from '@angular/core';

@Component({
  selector: 'app-findings-filter-bar',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <!-- Severity Filter -->
      <div class="flex items-center gap-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 mr-1">Severity:</span>
        @for (s of severities; track s) {
          <button
            (click)="selectedSeverity.set(selectedSeverity() === s ? '' : s); filterChange.emit()"
            class="px-2.5 py-1 text-xs rounded-lg border transition-colors"
            [class]="selectedSeverity() === s
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'"
          >
            {{ s }}
          </button>
        }
      </div>

      <div class="w-px h-5 bg-neutral-300 dark:bg-neutral-600"></div>

      <!-- Category Filter -->
      <div class="flex items-center gap-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 mr-1">Category:</span>
        @for (c of categories; track c) {
          <button
            (click)="selectedCategory.set(selectedCategory() === c ? '' : c); filterChange.emit()"
            class="px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize"
            [class]="selectedCategory() === c
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'"
          >
            {{ c }}
          </button>
        }
      </div>
    </div>
  `,
})
export class FindingsFilterBarComponent {
  protected readonly severities = ['critical', 'major', 'minor', 'info'];
  protected readonly categories = ['style', 'bug', 'security', 'performance'];

  readonly selectedSeverity = model('');
  readonly selectedCategory = model('');
  readonly filterChange = output<void>();
}
