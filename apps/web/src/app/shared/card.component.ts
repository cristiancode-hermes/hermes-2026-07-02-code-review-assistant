import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
<div class="bg-surface-card dark:bg-neutral-800 rounded-card border border-border dark:border-neutral-700 ">
@if (title() || subtitle()) {
<div class="px-5 py-4 border-b border-border dark:border-neutral-700">
@if (title()) {
<h3 class="heading-2 text-text-primary dark:text-text-primary-dark">{{ title() }}</h3>
}
@if (subtitle()) {
<p class="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">{{ subtitle() }}</p>
}
</div>
}
<div class="p-5">
<ng-content />
</div>
</div>
`,
})
export class CardComponent {
  readonly title = input('');
  readonly subtitle = input('');
}
