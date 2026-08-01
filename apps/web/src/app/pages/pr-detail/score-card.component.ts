import { Component, input } from '@angular/core';

export type ScoreCategory = 'style' | 'bug' | 'security' | 'performance';

@Component({
  selector: 'app-score-card',
  standalone: true,
  template: `
<div class="bg-surface-card dark:bg-neutral-800 rounded-card border border-border dark:border-neutral-700 p-5">
<div class="flex items-center justify-between mb-3">
<span class="text-sm font-medium text-text-primary dark:text-text-primary-dark capitalize">{{ category() }}</span>
<span class="heading-1" [class]="scoreColor()">{{ score() }}</span>
</div>
<div class="h-2.5 bg-border dark:bg-neutral-700 rounded-badge overflow-hidden">
<div
class="h-full rounded-badge transition-all duration-500"
[style.width.%]="score()"
[class]="barColor()"
></div>
</div>
<div class="flex items-center gap-1 mt-2">
<div class="w-2 h-2 rounded-badge" [class]="barColor()"></div>
<span class="text-xs" [class]="scoreColor()">
@if (score() >= 80) { Good }
@else if (score() >= 60) { Needs Improvement }
@else { Critical }
</span>
</div>
</div>
`,
})
export class ScoreCardComponent {
  readonly category = input<ScoreCategory>('style');
  readonly score = input<number>(0);

  protected scoreColor(): string {
    const s = this.score();
    if (s >= 80) return 'text-success';
    if (s >= 60) return 'text-warning';
    return 'text-danger';
  }

  protected barColor(): string {
    const s = this.score();
    if (s >= 80) return 'bg-success';
    if (s >= 60) return 'bg-warning';
    return 'bg-danger';
  }
}
