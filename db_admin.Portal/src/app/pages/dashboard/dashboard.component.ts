// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="logo-section">
            <img src="SPS_logo.png" alt="Logo" class="logo">
            <span class="logo-text">SPS DB</span>
          </div>
          <div class="user-section">
            <span class="welcome-text" *ngIf="currentUser">
              Welcome, {{ currentUser.full_name }}!
            </span>
            <button class="logout-btn" (click)="logout()">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="dashboard-main">
        <div class="dashboard-content">
          <h1>Database Administration Dashboard</h1>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Active Connections</h3>
              <p class="stat-number">12</p>
            </div>
            <div class="stat-card">
              <h3>Database Size</h3>
              <p class="stat-number">2.4 GB</p>
            </div>
            <div class="stat-card">
              <h3>Last Backup</h3>
              <p class="stat-number">2h ago</p>
            </div>
            <div class="stat-card">
              <h3>Alerts</h3>
              <p class="stat-number">0</p>
            </div>
          </div>

          <div class="actions-section">
            <h2>Quick Actions</h2>
            <div class="action-buttons">
              <button class="action-btn primary">
                <span>📊</span>
                View Reports
              </button>
              <button class="action-btn secondary">
                <span>🔧</span>
                Database Tools
              </button>
              <button class="action-btn secondary">
                <span>👥</span>
                User Management
              </button>
              <button class="action-btn secondary">
                <span>⚙️</span>
                Settings
              </button>
            </div>
          </div>

          <div class="recent-activity">
            <h2>Recent Activity</h2>
            <div class="activity-list">
              <div class="activity-item">
                <span class="activity-time">10:30 AM</span>
                <span class="activity-desc">Database backup completed successfully</span>
              </div>
              <div class="activity-item">
                <span class="activity-time">09:15 AM</span>
                <span class="activity-desc">User login: {{ currentUser?.email }}</span>
              </div>
              <div class="activity-item">
                <span class="activity-time">08:45 AM</span>
                <span class="activity-desc">System health check passed</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid #e1e5e9;
      padding: 0 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 70px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      height: 40px;
    }

    .logo-text {
      font-family: 'MuseoModerno', sans-serif;
      font-weight: 700;
      font-size: 20px;
      color: #333;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .welcome-text {
      font-weight: 500;
      color: #333;
    }

    .logout-btn {
      background: #393a39;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .logout-btn:hover {
      background: #2c2d2c;
    }

    .dashboard-main {
      padding: 2rem;
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-content h1 {
      font-size: 2rem;
      color: #333;
      margin-bottom: 2rem;
      font-family: 'DM Sans', sans-serif;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-card h3 {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #393a39;
      margin: 0;
    }

    .actions-section {
      margin-bottom: 3rem;
    }

    .actions-section h2 {
      color: #333;
      margin-bottom: 1rem;
      font-family: 'DM Sans', sans-serif;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .action-btn.primary {
      background: #393a39;
      color: white;
    }

    .action-btn.primary:hover {
      background: #2c2d2c;
      transform: translateY(-2px);
    }

    .action-btn.secondary {
      background: white;
      color: #393a39;
      border: 2px solid #e1e5e9;
    }

    .action-btn.secondary:hover {
      border-color: #393a39;
      transform: translateY(-2px);
    }

    .recent-activity {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .recent-activity h2 {
      color: #333;
      margin-bottom: 1rem;
      font-family: 'DM Sans', sans-serif;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-time {
      color: #666;
      font-size: 0.9rem;
      min-width: 80px;
    }

    .activity-desc {
      color: #333;
      flex: 1;
    }

    @media (max-width: 768px) {
      .dashboard-main {
        padding: 1rem;
      }

      .header-content {
        padding: 0 1rem;
      }

      .user-section {
        flex-direction: column;
        gap: 0.5rem;
      }

      .welcome-text {
        font-size: 0.9rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          // If no user, redirect to home
          this.router.navigate(['/']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
  }
}
