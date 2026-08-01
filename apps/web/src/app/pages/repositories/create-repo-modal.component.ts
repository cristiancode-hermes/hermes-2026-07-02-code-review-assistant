import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast.service';
import { ButtonComponent } from '../../shared/button.component';
import { ModalComponent } from '../../shared/modal.component';
import { InputFieldComponent } from '../../shared/input-field.component';

@Component({
  selector: 'app-create-repo-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent, ModalComponent, InputFieldComponent],
  template: `
<app-modal [open]="open()" title="Add Repository" size="md" (close)="close.emit()">
@if (error()) {
<div class="mb-4 p-3 rounded-btn bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-danger">
{{ error() }}
</div>
}
<form class="space-y-4">
<app-input-field
label="Repository URL"
type="text"
placeholder="https://github.com/user/repo"
[(value)]="repoUrl"
/>
<app-input-field
label="Repository Name"
type="text"
placeholder="my-awesome-project"
[(value)]="repoName"
/>
<div class="flex gap-3 justify-end pt-2">
<app-button variant="secondary" (handleClick)="close.emit()">Cancel</app-button>
<app-button [loading]="submitting()" (handleClick)="onSubmit()">Add Repository</app-button>
</div>
</form>
</app-modal>
`,
})
export class CreateRepoModalComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly open = input(false);
  readonly close = output<void>();
  readonly created = output<void>();

  protected repoUrl = '';
  protected repoName = '';
  protected submitting = signal(false);
  protected error = signal('');

  protected onSubmit(): void {
    if (!this.repoUrl) {
      this.error.set('Repository URL is required');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.api.createRepository({ url: this.repoUrl, name: this.repoName || undefined }).subscribe({
      next: () => {
        this.toast.success('Repository added successfully');
        this.submitting.set(false);
        this.created.emit();
        this.close.emit();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to add repository');
        this.submitting.set(false);
      },
    });
  }
}
