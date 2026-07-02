import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, DiffFile } from '../../services/api.service';
import { DiffHeaderComponent } from './diff-header.component';
import { DiffSideBySideComponent } from './diff-side-by-side.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ErrorStateComponent } from '../../shared/error-state.component';

@Component({
  selector: 'app-diff-viewer-page',
  standalone: true,
  imports: [
    RouterLink,
    DiffHeaderComponent,
    DiffSideBySideComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-4">
      @if (loading()) {
        <app-skeleton type="card" count="2" />
        <app-skeleton type="text" count="5" />
      } @else if (error()) {
        <app-error-state [message]="error()!" (retry)="loadDiff()" />
      } @else {
        @let diff = data();
        <a
          [routerLink]="['/repositories', repoId(), 'prs', prId()]"
          class="text-sm text-primary hover:text-primary-dark inline-block mb-2"
        >
          &larr; Back to pull request
        </a>

        <app-diff-header [file]="diff!" />

        <div class="overflow-x-auto">
          <app-diff-side-by-side [file]="diff!" />
        </div>
      }
    </div>
  `,
})
export class DiffViewerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  protected repoId = signal('');
  protected prId = signal('');
  protected fileId = signal('');
  protected data = signal<DiffFile | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  constructor() {
    this.repoId.set(this.route.snapshot.paramMap.get('repoId') ?? '');
    this.prId.set(this.route.snapshot.paramMap.get('prId') ?? '');
    this.fileId.set(this.route.snapshot.paramMap.get('fileId') ?? '');
    if (this.repoId() && this.prId() && this.fileId()) this.loadDiff();
  }

  protected loadDiff(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDiff(this.repoId(), this.prId(), this.fileId()).subscribe({
      next: (diff) => {
        this.data.set(diff);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load diff');
        this.loading.set(false);
      },
    });
  }
}
