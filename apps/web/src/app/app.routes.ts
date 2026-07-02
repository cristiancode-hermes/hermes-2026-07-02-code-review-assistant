import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          ),
      },
      {
        path: 'repositories',
        loadComponent: () =>
          import('./pages/repositories/repositories-page.component').then(
            (m) => m.RepositoriesPageComponent
          ),
      },
      {
        path: 'repositories/:id',
        loadComponent: () =>
          import(
            './pages/repository-detail/repository-detail-page.component'
          ).then((m) => m.RepositoryDetailPageComponent),
      },
      {
        path: 'repositories/:repoId/prs/:prId',
        loadComponent: () =>
          import('./pages/pr-detail/pr-detail-page.component').then(
            (m) => m.PrDetailPageComponent
          ),
      },
      {
        path: 'repositories/:repoId/prs/:prId/diff/:fileId',
        loadComponent: () =>
          import('./pages/diff-viewer/diff-viewer-page.component').then(
            (m) => m.DiffViewerPageComponent
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/review-history/review-history-page.component').then(
            (m) => m.ReviewHistoryPageComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings-page.component').then(
            (m) => m.SettingsPageComponent
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent
      ),
  },
];
