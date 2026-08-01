import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
<aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-surface-card dark:bg-neutral-800 border-r border-border dark:border-neutral-700 z-30">
<div class="flex items-center gap-3 px-6 py-5 border-b border-border dark:border-neutral-700">
<div class="w-8 h-8 rounded-btn bg-primary flex items-center justify-center">
<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
</svg>
</div>
<span class="text-lg font-bold text-text-primary dark:text-text-primary-dark">Hermes</span>
</div>

<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
<a
routerLink="/dashboard"
routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-medium"
class="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-neutral-600 dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-neutral-700/50 transition-colors"
>
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
</svg>
Dashboard
</a>
<a
routerLink="/repositories"
routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-medium"
class="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-neutral-600 dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-neutral-700/50 transition-colors"
>
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
</svg>
Repositories
</a>
<a
routerLink="/history"
routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-medium"
class="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-neutral-600 dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-neutral-700/50 transition-colors"
>
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
Review History
</a>
<a
routerLink="/settings"
routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-medium"
class="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-neutral-600 dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-neutral-700/50 transition-colors"
>
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
Settings
</a>
</nav>

<div class="px-3 py-4 border-t border-border dark:border-neutral-700">
<div class="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary dark:text-text-secondary-dark">
<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
<span class="text-xs">Code Review v1.0</span>
</div>
</div>
</aside>
`,
})
export class SidebarComponent {}
