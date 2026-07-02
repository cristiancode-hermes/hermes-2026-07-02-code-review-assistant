import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/button.component';
import { InputFieldComponent } from '../../shared/input-field.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterLink, FormsModule, ButtonComponent, InputFieldComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Create an account</h1>
          <p class="text-neutral-500 dark:text-neutral-400 mt-2">Get started with Hermes Code Review</p>
        </div>

        <div class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          @if (errorMessage()) {
            <div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-danger">
              {{ errorMessage() }}
            </div>
          }

          <form (ngSubmit)="onRegister()" class="space-y-4">
            <app-input-field
              label="Name"
              type="text"
              placeholder="Your name"
              [(value)]="name"
            />
            <app-input-field
              label="Email"
              type="email"
              placeholder="you@example.com"
              [(value)]="email"
            />
            <app-input-field
              label="Password"
              type="password"
              placeholder="Create a password"
              [(value)]="password"
            />
            <app-input-field
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              [(value)]="confirmPassword"
            />
            <app-button
              type="submit"
              class="w-full"
              [loading]="loading()"
              (handleClick)="onRegister()"
            >
              Create account
            </app-button>
          </form>
        </div>

        <p class="text-center mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?
          <a routerLink="/login" class="text-primary hover:text-primary-dark font-medium">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected name = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected loading = signal(false);
  protected errorMessage = signal('');

  protected onRegister(): void {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
