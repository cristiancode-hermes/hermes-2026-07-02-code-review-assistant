import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast.service';
import { ButtonComponent } from '../../shared/button.component';
import { ModalComponent } from '../../shared/modal.component';
import { InputFieldComponent } from '../../shared/input-field.component';

@Component({
  selector: 'app-create-pr-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent, ModalComponent, InputFieldComponent],
  template: `
    <app-modal [open]="open()" title="New Pull Request" size="md" (close)="close.emit()">
      @if (error()) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-danger">
          {{ error() }}
        </div>
      }
      <form class="space-y-4">
        <app-input-field label="Title" type="text" placeholder="PR title" [(value)]="title" />
        <app-input-field label="Source Branch" type="text" placeholder="feature/my-feature" [(value)]="sourceBranch" />
        <app-input-field label="Target Branch" type="text" placeholder="main" [(value)]="targetBranch" />
        <app-input-field label="Description" type="text" placeholder="Description (optional)" [(value)]="description" />
        <div class="flex gap-3 justify-end pt-2">
          <app-button variant="secondary" (handleClick)="close.emit()">Cancel</app-button>
          <app-button [loading]="submitting()" (handleClick)="onSubmit()">Create PR</app-button>
        </div>
      </form>
    </app-modal>
  `,
})
export class CreatePrModalComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly repoId = input('');
  readonly open = input(false);
  readonly close = output<void>();
  readonly created = output<void>();

  protected title = '';
  protected sourceBranch = '';
  protected targetBranch = '';
  protected description = '';
  protected submitting = signal(false);
  protected error = signal('');

  protected onSubmit(): void {
    if (!this.title || !this.sourceBranch || !this.targetBranch) {
      this.error.set('Title, source branch, and target branch are required');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.api
      .createPullRequest(this.repoId(), {
        title: this.title,
        sourceBranch: this.sourceBranch,
        targetBranch: this.targetBranch,
        description: this.description || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Pull request created');
          this.submitting.set(false);
          this.created.emit();
          this.close.emit();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create PR');
          this.submitting.set(false);
        },
      });
  }
}
