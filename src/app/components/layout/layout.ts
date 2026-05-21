import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <!-- Collapsible Sidebar -->
      <aside class="main-sidebar">
        <div class="sidebar-logo">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">SFR POS</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/billing" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">💵</span>
            <span class="nav-text">Billing (POS)</span>
          </a>
          <a routerLink="/categories" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📁</span>
            <span class="nav-text">Categories</span>
          </a>
          <a routerLink="/menu-items" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">🍕</span>
            <span class="nav-text">Menu Items</span>
          </a>
          <a routerLink="/gst" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📊</span>
            <span class="nav-text">GST Rates</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <span class="user-avatar">👤</span>
            <div class="user-details">
              <span class="user-name">{{ getUserName() }}</span>
              <span class="user-role">{{ api.currentUser()?.role || 'Staff' }}</span>
            </div>
          </div>
          <button (click)="handleLogout()" class="logout-btn">
            <span class="logout-icon">🚪</span>
            <span class="logout-text">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Panel -->
      <main class="main-content">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [`
    .sidebar-logo {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 12px;
      border-bottom: 1px solid var(--glass-border);
    }
    .logo-icon {
      font-size: 24px;
    }
    .logo-text {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sidebar-nav {
      flex: 1;
      padding-top: 20px;
    }
    .sidebar-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--glass-border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-avatar {
      font-size: 20px;
      background: rgba(255, 255, 255, 0.05);
      padding: 6px;
      border-radius: 50%;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-main);
    }
    .user-role {
      font-size: 11px;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: transparent;
      border: none;
      color: var(--color-danger);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 0;
      transition: var(--transition-smooth);
    }
    .logout-btn:hover {
      opacity: 0.8;
      transform: translateX(2px);
    }

    @media (max-width: 768px) {
      .sidebar-logo {
        justify-content: center;
        padding: 20px 0;
      }
      .sidebar-footer {
        padding: 20px 0;
        align-items: center;
      }
      .user-info, .logout-text {
        display: none;
      }
      .logout-btn {
        justify-content: center;
        padding: 10px 0;
        width: 100%;
      }
    }
  `]
})
export class LayoutComponent {
  constructor(protected api: ApiService, private router: Router) {
    // If not authenticated, send to login
    if (!this.api.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  getUserName(): string {
    const user = this.api.currentUser();
    if (!user) return 'Staff Member';
    return `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username;
  }

  handleLogout(): void {
    this.api.logout();
    this.router.navigate(['/login']);
  }
}
