import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../ui/button/button.component';
import { cn } from '../../../lib/utils';

interface NavItem {
  label: string;
  route: string;
  disabled?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <aside [class]="sidebarClasses">
      <!-- Logo -->
      <div [class]="logoClasses">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <svg class="h-5 w-5 text-sidebar-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        @if (!isCollapsed) {
          <div>
            <h1 class="text-lg font-semibold tracking-tight">Loan Surveillance</h1>
            <p class="text-xs text-sidebar-foreground/60">Multifamily</p>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav [class]="navClasses">
        <a
          routerLink="/"
          routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
          [routerLinkActiveOptions]="{ exact: true }"
          [class]="navItemClasses()"
          [title]="isCollapsed ? 'Loan List' : undefined"
        >
          <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          @if (!isCollapsed) {
            <span>Loan List</span>
          }
        </a>
        <a
          routerLink="/loans/1"
          routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
          [routerLinkActiveOptions]="{ exact: false }"
          [class]="navItemClasses()"
          [title]="isCollapsed ? 'Loan Detail' : undefined"
        >
          <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          @if (!isCollapsed) {
            <span>Loan Detail</span>
          }
        </a>
      </nav>

      <!-- Collapse Toggle -->
      <div [class]="collapseToggleClasses">
        <button
          (click)="onToggleCollapse.emit()"
          [class]="collapseButtonClasses"
          [title]="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          @if (isCollapsed) {
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
            </svg>
          } @else {
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
              </svg>
              <span>Collapse</span>
            </div>
          }
        </button>
      </div>

      <!-- User Section -->
      <div [class]="userSectionClasses">
        <div [class]="userInfoClasses">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            RM
          </div>
          @if (!isCollapsed) {
            <div class="flex-1">
              <p class="text-sm font-medium">Risk Manager</p>
              <p class="text-xs text-sidebar-foreground/60">Loan Auditing</p>
            </div>
          }
        </div>
        @if (!isCollapsed) {
          <div class="mt-2 flex gap-2">
            <button class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Help
            </button>
            <button class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        }
      </div>
    </aside>
  `,
  styles: []
})
export class AppSidebarComponent {
  @Input() isCollapsed = false;
  @Output() onToggleCollapse = new EventEmitter<void>();

  get sidebarClasses(): string {
    return cn(
      'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
      this.isCollapsed ? 'w-16' : 'w-64'
    );
  }

  get logoClasses(): string {
    return cn(
      'flex h-16 items-center border-b border-sidebar-border',
      this.isCollapsed ? 'justify-center px-2' : 'gap-3 px-6'
    );
  }

  get navClasses(): string {
    return cn('flex-1 space-y-1 py-4', this.isCollapsed ? 'px-2' : 'px-3');
  }

  navItemClasses(): string {
    return cn(
      'flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
      this.isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
      'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
    );
  }

  get collapseToggleClasses(): string {
    return cn('border-t border-sidebar-border', this.isCollapsed ? 'p-2' : 'p-3');
  }

  get collapseButtonClasses(): string {
    return cn(
      'flex w-full items-center rounded-lg py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      this.isCollapsed ? 'justify-center px-2' : 'gap-2 px-3'
    );
  }

  get userSectionClasses(): string {
    return cn('border-t border-sidebar-border', this.isCollapsed ? 'p-2' : 'p-3');
  }

  get userInfoClasses(): string {
    return cn(
      'flex items-center rounded-lg py-2',
      this.isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
    );
  }
}
