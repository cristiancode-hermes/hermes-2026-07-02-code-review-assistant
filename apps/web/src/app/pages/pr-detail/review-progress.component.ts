import { Component, input } from '@angular/core';
import { AgentProgress } from '../../services/api.service';

@Component({
  selector: 'app-review-progress',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Review Progress</h3>
      <div class="space-y-3">
        @for (agent of agents(); track agent.agent) {
          <div>
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-neutral-700 dark:text-neutral-300 capitalize font-medium">{{ agent.agent }}</span>
              <span class="text-xs" [class]="statusColor(agent.status)">
                {{ agent.status }}
                @if (agent.message) {
                  — {{ agent.message }}
                }
              </span>
            </div>
            <div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                [style.width.%]="agent.progress"
                [class]="statusBarColor(agent.status)"
              ></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ReviewProgressComponent {
  readonly agents = input<AgentProgress[]>([]);

  protected statusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-success';
      case 'failed': return 'text-danger';
      case 'analyzing': return 'text-accent';
      default: return 'text-neutral-500';
    }
  }

  protected statusBarColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'failed': return 'bg-danger';
      case 'analyzing': return 'bg-accent';
      default: return 'bg-neutral-400';
    }
  }
}
