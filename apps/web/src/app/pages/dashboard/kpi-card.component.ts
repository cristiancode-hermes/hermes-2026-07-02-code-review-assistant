import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          [class]="'bg-' + color() + '-100 dark:bg-' + color() + '-900/20 text-' + color() + '-600 dark:text-' + color() + '-400'"
        >
          <ng-content select="[icon]" />
        </div>
      </div>
      <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ value() }}</p>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ label() }}</p>
    </div>
  `,
})
export class KpiCardComponent {
  readonly label = input('');
  readonly value = input<string | number>('');
  readonly color = input<string>('primary');
}
