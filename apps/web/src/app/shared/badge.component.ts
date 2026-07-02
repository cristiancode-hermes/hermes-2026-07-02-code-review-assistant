import { Component, input } from '@angular/core';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'secondary';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center font-medium rounded-full"
      [class]="sizeClasses() + ' ' + colorClasses()"
    >
      @if (dot()) {
        <span class="w-1.5 h-1.5 rounded-full mr-1.5" [class]="dotColor()"></span>
      }
      {{ text() }}
    </span>
  `,
})
export class BadgeComponent {
  readonly text = input('');
  readonly variant = input<BadgeVariant>('info');
  readonly size = input<'sm' | 'md'>('sm');
  readonly dot = input(false);

  protected sizeClasses() {
    return this.size() === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  }

  protected colorClasses() {
    switch (this.variant()) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'danger':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'info':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'primary':
        return 'bg-primary/10 text-primary dark:bg-primary/20';
      case 'secondary':
        return 'bg-secondary/10 text-secondary dark:bg-secondary/20';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
    }
  }

  protected dotColor() {
    switch (this.variant()) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      case 'info':
        return 'bg-indigo-500';
      default:
        return 'bg-neutral-500';
    }
  }
}
