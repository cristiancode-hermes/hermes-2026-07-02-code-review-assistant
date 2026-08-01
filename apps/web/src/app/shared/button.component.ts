import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
<button
[disabled]="disabled() || loading()"
(click)="handleClick.emit($event)"
class="inline-flex items-center justify-center font-medium rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
[class]="variantClasses()"
>
@if (loading()) {
<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
}
<ng-content />
</button>
`,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly handleClick = output<MouseEvent>();

  protected variantClasses() {
    const base = this.size() === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : this.size() === 'lg'
        ? 'px-6 py-3 text-lg'
        : 'px-4 py-2 text-sm';

    switch (this.variant()) {
      case 'primary':
        return `${base} bg-primary text-white hover:bg-primary-dark`;
      case 'secondary':
        return `${base} bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600`;
      case 'ghost':
        return `${base} text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800`;
      case 'danger':
        return `${base} bg-danger text-white hover:bg-red-600`;
      default:
        return `${base} bg-primary text-white hover:bg-primary-dark`;
    }
  }
}
