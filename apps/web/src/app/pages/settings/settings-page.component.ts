import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { CardComponent } from '../../shared/card.component';
import { ButtonComponent } from '../../shared/button.component';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, CardComponent, ButtonComponent],
  template: `
<div class="space-y-6 max-w-2xl">
<div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Settings</h1>
<p class="text-text-secondary dark:text-text-secondary-dark mt-1">Manage your preferences</p>
</div>

<!-- Appearance -->
<app-card title="Appearance">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-text-primary dark:text-text-primary-dark">Dark Mode</p>
<p class="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">Toggle dark mode for the interface</p>
</div>
<button
(click)="themeService.toggle()"
class="relative w-11 h-6 rounded-badge transition-colors"
[class]="themeService.isDark() ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600'"
>
<span
class="absolute top-0.5 w-5 h-5 bg-surface-card rounded-badge transition-transform"
[class.translate-x-5]="themeService.isDark()"
[class.translate-x-0.5]="!themeService.isDark()"
></span>
</button>
</div>
</app-card>

<!-- Notifications -->
<app-card title="Notifications">
<div class="space-y-4">
@for (pref of notificationPrefs; track pref.key) {
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-text-primary dark:text-text-primary-dark">{{ pref.label }}</p>
<p class="text-xs text-text-secondary dark:text-text-secondary-dark">{{ pref.description }}</p>
</div>
<button
(click)="pref.enabled = !pref.enabled"
class="relative w-11 h-6 rounded-badge transition-colors"
[class]="pref.enabled ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600'"
>
<span
class="absolute top-0.5 w-5 h-5 bg-surface-card rounded-badge transition-transform"
[class.translate-x-5]="pref.enabled"
[class.translate-x-0.5]="!pref.enabled"
></span>
</button>
</div>
}
</div>
</app-card>

<!-- Save -->
<div class="flex justify-end">
<app-button (handleClick)="saveSettings()" [loading]="saving()">
Save Settings
</app-button>
</div>
</div>
`,
})
export class SettingsPageComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);

  protected saving = signal(false);

  protected notificationPrefs = [
    {
      key: 'review_completed',
      label: 'Review Completed',
      description: 'Get notified when a code review finishes',
      enabled: true,
    },
    {
      key: 'new_findings',
      label: 'New Findings',
      description: 'Get notified when new issues are found',
      enabled: true,
    },
    {
      key: 'pr_updated',
      label: 'PR Updates',
      description: 'Get notified when a pull request is updated',
      enabled: false,
    },
  ];

  protected saveSettings(): void {
    this.saving.set(true);
    // Simulate save
    setTimeout(() => {
      this.toast.success('Settings saved successfully');
      this.saving.set(false);
    }, 500);
  }
}
