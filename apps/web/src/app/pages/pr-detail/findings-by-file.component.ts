import { Component, input } from '@angular/core';
import { Finding } from '../../services/api.service';
import { FindingItemComponent } from './finding-item.component';

@Component({
  selector: 'app-findings-by-file',
  standalone: true,
  imports: [FindingItemComponent],
  template: `
    <div class="space-y-4">
      @for (group of groupedFindings(); track group.fileName) {
        <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div class="px-4 py-3 bg-neutral-50 dark:bg-neutral-750 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100 font-mono">{{ group.fileName }}</span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ group.findings.length }} finding{{ group.findings.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="divide-y divide-neutral-200 dark:divide-neutral-700">
            @for (finding of group.findings; track finding.id) {
              <app-finding-item [finding]="finding" />
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class FindingsByFileComponent {
  readonly findings = input<Finding[]>([]);

  protected groupedFindings() {
    const groups = new Map<string, Finding[]>();
    for (const f of this.findings()) {
      const existing = groups.get(f.fileName) || [];
      existing.push(f);
      groups.set(f.fileName, existing);
    }
    return Array.from(groups.entries()).map(([fileName, findings]) => ({
      fileName,
      findings,
    }));
  }
}
