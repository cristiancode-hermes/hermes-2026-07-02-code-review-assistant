import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Repository } from '../../services/api.service';
import { RepositoryCardComponent } from './repository-card.component';
import { CreateRepoModalComponent } from './create-repo-modal.component';
import { ButtonComponent } from '../../shared/button.component';
import { SearchBarComponent } from '../../shared/search-bar.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';

@Component({
  selector: 'app-repositories-page',
  standalone: true,
  imports: [
    RepositoryCardComponent,
    CreateRepoModalComponent,
    ButtonComponent,
    SearchBarComponent,
    SkeletonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
<div class="space-y-6">
<div class="flex items-center justify-between">
<div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Repositories</h1>
<p class="text-text-secondary dark:text-text-secondary-dark mt-1">Manage your connected repositories</p>
</div>
<app-button (handleClick)="showCreateModal.set(true)">
<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
</svg>
Add Repository
</app-button>
</div>

<app-search-bar
placeholder="Search repositories..."
[(query)]="searchQuery"
(search)="onSearch($event)"
/>

@if (loading()) {
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<app-skeleton type="card" count="4" />
</div>
} @else if (error()) {
<app-error-state [message]="error()!" (retry)="loadRepos()" />
} @else if (filteredRepos().length === 0) {
@if (searchQuery()) {
<app-empty-state
title="No repositories found"
[message]="'No repositories match &quot;' + searchQuery() + '&quot;'"
/>
} @else {
<app-empty-state
title="No repositories yet"
message="Connect your first repository to get started with code reviews."
actionLabel="Add Repository"
(action)="showCreateModal.set(true)"
/>
}
} @else {
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
@for (repo of filteredRepos(); track repo.id) {
<app-repository-card [repo]="repo" />
}
</div>
}
</div>

<app-create-repo-modal
[open]="showCreateModal()"
(close)="showCreateModal.set(false)"
(created)="loadRepos()"
/>
`,
})
export class RepositoriesPageComponent {
  private readonly api = inject(ApiService);

  protected repositories = signal<Repository[]>([]);
  protected searchQuery = signal('');
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected showCreateModal = signal(false);

  constructor() {
    this.loadRepos();
  }

  protected loadRepos(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getRepositories().subscribe({
      next: (repos) => {
        this.repositories.set(repos);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load repositories');
        this.loading.set(false);
      },
    });
  }

  protected filteredRepos = () => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.repositories();
    return this.repositories().filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  };

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}
