import { Component, input } from '@angular/core';
import { Finding } from '../../services/api.service';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-finding-item',
  standalone: true,
  imports: [BadgeComponent],
  template: `
<div class="p-4 hover:bg-surface dark:hover:bg-neutral-750 transition-colors">
<div class="flex items-start gap-3">
<div
class="w-2 h-2 rounded-badge mt-1.5 flex-shrink-0"
[class]="severityDot()"
></div>
<div class="flex-1 min-w-0">
<div class="flex items-center gap-2 mb-1">
<span class="text-sm font-medium text-text-primary dark:text-text-primary-dark">{{ finding().title }}</span>
<app-badge [text]="finding().severity" [variant]="severityBadge()" size="sm" />
<app-badge [text]="finding().category" variant="info" size="sm" />
</div>
<p class="text-sm text-neutral-600 dark:text-text-secondary-dark mb-2">{{ finding().description }}</p>
<div class="flex items-center gap-3 text-xs text-text-secondary dark:text-text-secondary-dark">
<span>Line {{ finding().line }}</span>
@if (finding().suggestion) {
<span class="text-primary">Suggestion available</span>
}
</div>
</div>
</div>
</div>
`,
})
export class FindingItemComponent {
  readonly finding = input.required<Finding>();

  protected severityDot(): string {
    switch (this.finding().severity) {
      case 'critical': return 'bg-danger';
      case 'major': return 'bg-major';
      case 'minor': return 'bg-minor';
      default: return 'bg-info';
    }
  }

  protected severityBadge(): 'danger' | 'warning' | 'success' | 'info' {
    switch (this.finding().severity) {
      case 'critical': return 'danger';
      case 'major': return 'warning';
      case 'minor': return 'success';
      default: return 'info';
    }
  }
}
