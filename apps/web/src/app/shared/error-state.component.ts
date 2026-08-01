import { Component, input, output } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ButtonComponent],
  template: `
<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
<div class="w-16 h-16 mb-4 text-danger">
<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
</svg>
</div>
<h3 class="heading-2 text-text-primary dark:text-text-primary-dark mb-1">
Something went wrong
</h3>
<p class="text-sm text-text-secondary dark:text-text-secondary-dark max-w-sm mb-6">
{{ message() }}
</p>
@if (showRetry()) {
<app-button (handleClick)="retry.emit()" variant="primary">
Try Again
</app-button>
}
</div>
`,
})
export class ErrorStateComponent {
  readonly message = input('An unexpected error occurred. Please try again.');
  readonly showRetry = input(true);
  readonly retry = output<void>();
}
