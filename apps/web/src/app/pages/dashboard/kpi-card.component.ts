import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
<div class="bg-surface-card dark:bg-neutral-800 rounded-card border border-border dark:border-neutral-700 p-5">
<div class="flex items-center justify-between mb-3">
<div
class="w-10 h-10 rounded-btn flex items-center justify-center"
[class]="'bg-' + color() + '-100 dark:bg-' + color() + '-900/20 text-' + color() + '-600 dark:text-' + color() + '-400'"
>
<ng-content select="[icon]" />
</div>
</div>
<p class="heading-1 text-text-primary dark:text-text-primary-dark">{{ value() }}</p>
<p class="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">{{ label() }}</p>
</div>
`,
})
export class KpiCardComponent {
  readonly label = input('');
  readonly value = input<string | number>('');
  readonly color = input<string>('primary');
}
