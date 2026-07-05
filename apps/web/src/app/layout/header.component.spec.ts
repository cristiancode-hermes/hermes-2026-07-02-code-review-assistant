import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService, User } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let nativeElement: HTMLElement;
  let authUserSignal: WritableSignal<User | null>;
  let authIsAuthenticatedSignal: WritableSignal<boolean>;
  let themeIsDarkSignal: WritableSignal<boolean>;
  let logoutSpy: ReturnType<typeof vi.fn>;
  let toggleSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authUserSignal = signal<User | null>(null);
    authIsAuthenticatedSignal = signal(false);
    themeIsDarkSignal = signal(false);
    logoutSpy = vi.fn();
    toggleSpy = vi.fn();

    const mockAuthService = {
      user: authUserSignal,
      isAuthenticated: authIsAuthenticatedSignal,
      logout: logoutSpy,
    } as unknown as AuthService;

    const mockThemeService = {
      isDark: themeIsDarkSignal,
      toggle: toggleSpy,
      setTheme: vi.fn(),
    } as unknown as ThemeService;

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    nativeElement = fixture.debugElement.nativeElement;
    fixture.detectChanges();
  });

  describe('component creation', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe('initials display', () => {
    it('should show "U" when no user name is set', () => {
      TestBed.inject(AuthService).user.set(null);
      fixture.detectChanges();
      const initialsEl = nativeElement.querySelector('.rounded-full');
      expect(initialsEl?.textContent?.trim()).toBe('U');
    });

    it('should show first two letters of a single-word name', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'john@test.com',
        name: 'John',
      });
      fixture.detectChanges();
      const initialsEl = nativeElement.querySelector('.rounded-full');
      expect(initialsEl?.textContent?.trim()).toBe('JO');
    });

    it('should show first letters of first and last name', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'john@test.com',
        name: 'John Doe',
      });
      fixture.detectChanges();
      const initialsEl = nativeElement.querySelector('.rounded-full');
      expect(initialsEl?.textContent?.trim()).toBe('JD');
    });

    it('should handle multiple names and take first and last initials', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'john@test.com',
        name: 'John Michael Doe',
      });
      fixture.detectChanges();
      const initialsEl = nativeElement.querySelector('.rounded-full');
      expect(initialsEl?.textContent?.trim()).toBe('JD');
    });

    it('should handle empty name string', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'john@test.com',
        name: '',
      });
      fixture.detectChanges();
      const initialsEl = nativeElement.querySelector('.rounded-full');
      expect(initialsEl?.textContent?.trim()).toBe('U');
    });

    it('should show raw substring for whitespace-only names', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'john@test.com',
        name: '   ',
      });
      fixture.detectChanges();
      const initialsEl = nativeElement.querySelector('.rounded-full');
      // initials() takes substring(0,2) without trimming first
      expect(initialsEl?.textContent?.trim()).toBe('');
    });
  });

  describe('user display', () => {
    it('should show user name when user is logged in', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'alice@test.com',
        name: 'Alice Smith',
      });
      fixture.detectChanges();
      const allSpans = nativeElement.querySelectorAll('span');
      const userNameSpan = Array.from(allSpans).find(
        (s) => s.textContent?.trim() === 'Alice Smith'
      );
      expect(userNameSpan).toBeTruthy();
    });

    it('should show "User" as fallback when user has no name', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'alice@test.com',
        name: '',
      });
      fixture.detectChanges();
      const allSpans = nativeElement.querySelectorAll('span');
      const userSpan = Array.from(allSpans).find(
        (s) => s.textContent?.trim() === 'User'
      );
      expect(userSpan).toBeTruthy();
    });
  });

  describe('theme toggle', () => {
    it('should call themeService.toggle() when theme button is clicked', () => {
      const themeButtons = nativeElement.querySelectorAll('button');
      const themeButton = Array.from(themeButtons).find((btn) =>
        btn.getAttribute('aria-label')?.includes('Switch to')
      );
      expect(themeButton).toBeTruthy();
      themeButton?.click();
      expect(toggleSpy).toHaveBeenCalledTimes(1);
    });

    it('should show sun icon when dark mode is enabled', () => {
      themeIsDarkSignal.set(true);
      fixture.detectChanges();
      const themeButton = Array.from(
        nativeElement.querySelectorAll('button')
      ).find(
        (btn) =>
          btn.getAttribute('aria-label') === 'Switch to light mode'
      );
      expect(themeButton).toBeTruthy();
    });

    it('should show moon icon when dark mode is disabled', () => {
      themeIsDarkSignal.set(false);
      fixture.detectChanges();
      const themeButton = Array.from(
        nativeElement.querySelectorAll('button')
      ).find(
        (btn) =>
          btn.getAttribute('aria-label') === 'Switch to dark mode'
      );
      expect(themeButton).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should call authService.logout() when sign out is clicked', () => {
      TestBed.inject(AuthService).user.set({
        id: '1',
        email: 'alice@test.com',
        name: 'Alice',
      });
      fixture.detectChanges();

      const allButtons = nativeElement.querySelectorAll('button');
      const signOutButton = Array.from(allButtons).find(
        (btn) => btn.textContent?.trim() === 'Sign out'
      );
      expect(signOutButton).toBeTruthy();
      signOutButton?.click();
      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
  });
});
