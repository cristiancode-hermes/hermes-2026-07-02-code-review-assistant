import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="relative">
<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
<input
type="text"
[placeholder]="placeholder()"
[(ngModel)]="query"
(ngModelChange)="search.emit($event)"
(keydown.escape)="onClear()"
class="w-full pl-10 pr-8 py-2 rounded-btn border border-border dark:border-neutral-600 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
/>
@if (query()) {
<button
(click)="onClear()"
class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-dark hover:text-neutral-600 dark:hover:text-text-primary-dark"
>
<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
}
</div>
`,
})
export class SearchBarComponent {
  readonly placeholder = input('Search...');
  readonly query = model('');
  readonly search = output<string>();

  protected onClear(): void {
    this.query.set('');
    this.search.emit('');
  }
}
