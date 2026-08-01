import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
<header class="lg:ml-64 fixed top-0 right-0 left-0 lg:left-64 z-20 h-16 bg-surface-card/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-border dark:border-neutral-700">
<div class="flex items-center justify-between h-full px-6">
<div class="flex items-center gap-3">
<!-- Mobile menu button -->
<button class="lg:hidden p-2 rounded-btn hover:bg-surface dark:hover:bg-neutral-700 text-neutral-600 dark:text-text-secondary-dark">
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
</svg>
</button>
</div>

<div class="flex items-center gap-3">
<!-- Dark mode toggle -->
<button
(click)="themeService.toggle()"
class="p-2 rounded-btn hover:bg-surface dark:hover:bg-neutral-700 text-neutral-600 dark:text-text-secondary-dark transition-colors"
[attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
>
@if (themeService.isDark()) {
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
</svg>
} @else {
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
</svg>
}
</button>

<!-- User menu -->
<div class="relative group">
<button class="flex items-center gap-2 p-2 rounded-btn hover:bg-surface dark:hover:bg-neutral-700 transition-colors">
<div class="w-8 h-8 rounded-badge bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
{{ initials() }}
</div>
<span class="hidden sm:block text-sm font-medium text-text-primary dark:text-text-primary-dark">
{{ authService.user()?.name || 'User' }}
</span>
</button>
<div class="absolute right-0 mt-1 w-48 bg-surface-card dark:bg-neutral-800 rounded-btn border border-border dark:border-neutral-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
<button
(click)="authService.logout()"
class="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-surface dark:hover:bg-neutral-700"
>
Sign out
</button>
</div>
</div>
</div>
</div>
</header>
`,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected initials(): string {
    const name = this.authService.user()?.name || 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
