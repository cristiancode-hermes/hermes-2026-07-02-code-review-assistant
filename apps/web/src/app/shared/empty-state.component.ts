import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgTemplateOutlet, ButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      @if (icon()) {
        <div class="w-16 h-16 mb-4 text-neutral-400 dark:text-neutral-500">
          <ng-container [ngTemplateOutlet]="iconTemplate" />
        </div>
      } @else {
        <svg class="w-16 h-16 mb-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      }
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        {{ title() }}
      </h3>
      @if (message()) {
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-6">
          {{ message() }}
        </p>
      }
      @if (actionLabel()) {
        <app-button (handleClick)="action.emit()" variant="primary">
          {{ actionLabel() }}
        </app-button>
      }
    </div>

    <ng-template #iconTemplate>
      <ng-content select="[icon]" />
    </ng-template>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('');
  readonly title = input('');
  readonly message = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
