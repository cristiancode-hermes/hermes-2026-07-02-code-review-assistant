import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    // Crimson identity: dark by default (blood red on black); respect explicit light choice
    const initial = saved ? saved === 'dark' : true;
    this.isDark.set(initial);
    this.applyTheme(initial);

    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  setTheme(dark: boolean): void {
    this.isDark.set(dark);
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
