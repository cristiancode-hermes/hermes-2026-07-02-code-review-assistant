import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/button.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div class="text-center max-w-md">
        <h1 class="text-7xl font-bold text-primary mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Page not found</h2>
        <p class="text-neutral-500 dark:text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a routerLink="/dashboard">
          <app-button variant="primary">Go to Dashboard</app-button>
        </a>
      </div>
    </div>
  `,
})
export class NotFoundPageComponent {}
