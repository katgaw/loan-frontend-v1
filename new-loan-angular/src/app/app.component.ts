import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from './components/app-sidebar/app-sidebar.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent, HeaderComponent],
  template: `
    <div class="min-h-screen bg-background">
      <!-- Sidebar - Desktop -->
      <div class="hidden lg:block">
        <app-sidebar [isCollapsed]="sidebarCollapsed" (onToggleCollapse)="onSidebarToggleCollapse()"></app-sidebar>
      </div>

      <!-- Mobile Sidebar Overlay -->
      @if (sidebarOpen) {
        <div class="fixed inset-0 z-50 lg:hidden">
          <div
            class="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            (click)="sidebarOpen = false"
          ></div>
          <app-sidebar></app-sidebar>
        </div>
      }

      <!-- Main Content -->
      <div [class.lg:ml-64]="!sidebarCollapsed" [class.lg:ml-16]="sidebarCollapsed" style="transition: margin-left 300ms">
        <!-- Top Header -->
        <app-header
          [sidebarOpen]="sidebarOpen"
          (toggleSidebar)="sidebarOpen = !sidebarOpen"
        ></app-header>

        <!-- Page Content -->
        <main class="p-4 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class AppComponent {
  sidebarOpen = false;
  sidebarCollapsed = false;

  onToggleCollapse() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarToggleCollapse() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
