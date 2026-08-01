import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="flex flex-col gap-1.5">
@if (label()) {
<label class="text-sm font-medium text-text-primary dark:text-text-primary-dark">
{{ label() }}
</label>
}
<input
[type]="type()"
[placeholder]="placeholder()"
[disabled]="disabled()"
[(ngModel)]="value"
class="w-full px-3 py-2 rounded-btn border border-border dark:border-neutral-600 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
/>
@if (error()) {
<p class="text-sm text-danger">{{ error() }}</p>
}
</div>
`,
})
export class InputFieldComponent {
  readonly label = input('');
  readonly type = input('text');
  readonly placeholder = input('');
  readonly disabled = input(false);
  readonly error = input('');
  readonly value = model('');
}
