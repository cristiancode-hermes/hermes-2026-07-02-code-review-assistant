import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
<div class="min-h-screen bg-surface dark:bg-neutral-900">
<app-sidebar />
<app-header />
<main class="lg:ml-64 pt-16 min-h-screen">
<div class="p-6 max-w-7xl mx-auto">
<router-outlet />
</div>
</main>
</div>
`,
})
export class LayoutComponent {}
