import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/button.component';
import { InputFieldComponent } from '../../shared/input-field.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink, FormsModule, ButtonComponent, InputFieldComponent],
  template: `
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 px-4">
<div class="w-full max-w-md">
<div class="text-center mb-8">
<div class="w-12 h-12 rounded-card bg-primary flex items-center justify-center mx-auto mb-4">
<svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
</svg>
</div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Welcome back</h1>
<p class="text-text-secondary dark:text-text-secondary-dark mt-2">Sign in to your Hermes account</p>
</div>

<div class="bg-surface-card dark:bg-neutral-800 rounded-card border border-border dark:border-neutral-700 p-6">
@if (errorMessage()) {
<div class="mb-4 p-3 rounded-btn bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-danger">
{{ errorMessage() }}
</div>
}

<form (ngSubmit)="onLogin()" class="space-y-4">
<app-input-field
label="Email"
type="email"
placeholder="you@example.com"
[(value)]="email"
/>
<app-input-field
label="Password"
type="password"
placeholder="Enter your password"
[(value)]="password"
/>
<app-button
type="submit"
class="w-full"
[loading]="loading()"
(handleClick)="onLogin()"
>
Sign in
</app-button>
</form>
</div>

<p class="text-center mt-6 text-sm text-text-secondary dark:text-text-secondary-dark">
Don't have an account?
<a routerLink="/register" class="text-primary hover:text-primary-dark font-medium">Sign up</a>
</p>
</div>
</div>
`,
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected loading = signal(false);
  protected errorMessage = signal('');

  protected onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Login failed');
        this.loading.set(false);
      },
    });
  }
}
