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
      <!-- Left Sidebar -->
      <aside class="left-sidebar">
        <!-- User Profile Section -->
        <div class="user-profile">
          <div class="user-info" *ngIf="currentUser">
            <h3 class="user-name">{{ currentUser.full_name }}</h3>
            <p class="user-title">Database Administrator</p>
          </div>
          <button class="logout-btn-top" (click)="logout()">
            <span>Logout</span>
          </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <a href="#" class="nav-item active" (click)="setActiveSection('home', $event)">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Dashboard</span>
          </a>
          <a href="#" class="nav-item" (click)="setActiveSection('about', $event)">
            <span class="nav-icon">👤</span>
            <span class="nav-text">About</span>
          </a>
          <a href="#" class="nav-item" (click)="setActiveSection('services', $event)">
            <span class="nav-icon">💼</span>
            <span class="nav-text">Services</span>
          </a>
          <a href="#" class="nav-item" (click)="setActiveSection('projects', $event)">
            <span class="nav-icon">💻</span>
            <span class="nav-text">Projects</span>
          </a>
          <a href="#" class="nav-item" (click)="setActiveSection('shop', $event)">
            <span class="nav-icon">🛒</span>
            <span class="nav-text">Shop</span>
          </a>
          <a href="#" class="nav-item" (click)="setActiveSection('blog', $event)">
            <span class="nav-icon">📝</span>
            <span class="nav-text">Blog</span>
          </a>
          <a href="#" class="nav-item" (click)="setActiveSection('contact', $event)">
            <span class="nav-icon">✉️</span>
            <span class="nav-text">Contact</span>
          </a>
        </nav>

        <!-- Logout Button -->
        <div class="sidebar-footer">
          <!-- Footer content removed since logout is now at top -->
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Top Header with Logo -->
        <header class="content-header">
          <div class="header-center">
            <h1 class="section-name">{{ getSectionDisplayName(activeSection) }}</h1>
          </div>
          <div class="header-right">
            <div class="logo-section">
              <img src="SPS_logo.png" alt="Logo" class="logo">
              <span class="logo-text">SPS DB</span>
            </div>
          </div>
        </header>

        <!-- Dashboard Content -->
        <div class="content-wrapper">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <h2>Database Administration Dashboard.</h2>
            <p class="welcome-description">
              A continuación los siguientes servicios se encuentran operando con normalidad.
            </p>
            <div class="action-buttons">
              <button class="btn btn-primary">Get Report</button>
              <button class="btn btn-secondary">Analyze</button>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <h3>Active Connections</h3>
                <p class="stat-number">12</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💾</div>
              <div class="stat-info">
                <h3>Database Size</h3>
                <p class="stat-number">2.4 GB</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔄</div>
              <div class="stat-info">
                <h3>Last Backup</h3>
                <p class="stat-number">2h ago</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚠️</div>
              <div class="stat-info">
                <h3>Alerts</h3>
                <p class="stat-number">0</p>
              </div>
            </div>
          </div>

          <!-- Selected Projects Section -->
          <div class="projects-section">
            <div class="section-header">
              <h2>Quick Actions</h2>
              <button class="view-all-btn">All Actions</button>
            </div>

            <div class="projects-grid">
              <div class="project-card">
                <div class="project-image">
                  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop" alt="Database Analytics Project">
                </div>
                <div class="project-content">
                  <h3>Database Analytics Dashboard</h3>
                  <p>Real-time analytics and monitoring system for enterprise databases.</p>
                </div>
              </div>

              <div class="project-card">
                <div class="project-image">
                  <img src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop" alt="Data Migration Project">
                </div>
                <div class="project-content">
                  <h3>Data Migration System</h3>
                  <p>Automated data migration and synchronization between multiple databases.</p>
                </div>
              </div>

              <div class="project-card">
                <div class="project-image">
                  <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop" alt="Backup Management">
                </div>
                <div class="project-content">
                  <h3>Backup Management Portal</h3>
                  <p>Comprehensive backup scheduling and recovery management interface.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="recent-activity">
            <h2>Recent Activity</h2>
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-icon">✅</div>
                <div class="activity-content">
                  <span class="activity-desc">Database backup completed successfully</span>
                  <span class="activity-time">10:30 AM</span>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon">👤</div>
                <div class="activity-content">
                  <span class="activity-desc">User login: {{ currentUser?.email }}</span>
                  <span class="activity-time">09:15 AM</span>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon">🔍</div>
                <div class="activity-content">
                  <span class="activity-desc">System health check passed</span>
                  <span class="activity-time">08:45 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      background: #ffffff;
      color: #1f2937;
    }

    /* Left Sidebar Styles */
    .left-sidebar {
      width: 280px;
      background: #fafafa;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      padding: 2rem 0;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }

    .user-profile {
      padding: 0 2rem 2rem;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 2rem;
    }

    .user-avatar {
      margin-bottom: 1rem;
    }

    .avatar-img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #e5e7eb;
    }

    .user-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      font-family: 'DM Sans', sans-serif;
    }

    .user-title {
      margin: 0 0 1rem 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .sidebar-nav {
      flex: 1;
      padding: 0 1rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      color: #6b7280;
      text-decoration: none;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      transition: all 0.2s ease;
      font-family: 'DM Sans', sans-serif;
    }

    .nav-item:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .nav-item.active {
      background: #f3f4f6;
      color: #111827;
      font-weight: 500;
    }

    .nav-icon {
      font-size: 1.2rem;
      width: 24px;
      text-align: center;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .logout-btn-top {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 0.75rem 1.25rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'DM Sans', sans-serif;
      margin-top: 1rem;
    }

    .logout-btn-top:hover {
      border-color: #d1d5db;
      color: #111827;
      background: #f9fafb;
    }

    .section-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      font-family: 'DM Sans', sans-serif;
    }

    /* Main Content Styles */
    .main-content {
      flex: 1;
      margin-left: 280px;
      background: #ffffff;
      min-height: 100vh;
    }

    .content-header {
      display: flex;
      justify-content: flex-end;
      padding: 2rem;
      border-bottom: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .header-right {
      display: flex;
      align-items: center;
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
      color: #111827;
    }

    .content-wrapper {
      padding: 3rem;
    }

    /* Welcome Section */
    .welcome-section {
      margin-bottom: 4rem;
    }

    .welcome-section h1 {
      font-size: 3.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: #111827;
      font-family: 'DM Sans', sans-serif;
    }

    .welcome-section h2 {
      font-size: 3.5rem;
      font-weight: 700;
      margin: 0 0 2rem 0;
      color: #111827;
      font-family: 'DM Sans', sans-serif;
    }

    .welcome-description {
      font-size: 1.2rem;
      color: #6b7280;
      margin-bottom: 2rem;
      max-width: 600px;
      line-height: 1.6;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'DM Sans', sans-serif;
    }

    .btn-primary {
      background: #111827;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1f2937;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .btn-secondary {
      background: transparent;
      color: #111827;
      border: 2px solid #e5e7eb;
    }

    .btn-secondary:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 4rem;
    }

    .stat-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .stat-info h3 {
      margin: 0 0 0.5rem 0;
      color: #6b7280;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .stat-number {
      font-size: 1.8rem;
      font-weight: bold;
      color: #111827;
      margin: 0;
    }

    /* Projects Section */
    .projects-section {
      margin-bottom: 4rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .section-header h2 {
      font-size: 2rem;
      color: #111827;
      margin: 0;
      font-family: 'DM Sans', sans-serif;
    }

    .view-all-btn {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'DM Sans', sans-serif;
    }

    .view-all-btn:hover {
      border-color: #d1d5db;
      color: #111827;
      background: #f9fafb;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }

    .project-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .project-image {
      height: 200px;
      overflow: hidden;
    }

    .project-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .project-card:hover .project-image img {
      transform: scale(1.05);
    }

    .project-content {
      padding: 1.5rem;
    }

    .project-content h3 {
      margin: 0 0 1rem 0;
      color: #111827;
      font-size: 1.2rem;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
    }

    .project-content p {
      margin: 0;
      color: #6b7280;
      line-height: 1.5;
    }

    /* Recent Activity */
    .recent-activity {
      background: #fafafa;
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid #e5e7eb;
    }

    .recent-activity h2 {
      color: #111827;
      margin-bottom: 1.5rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 1.5rem;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;
    }

    .activity-item:hover {
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      font-size: 1.2rem;
    }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .activity-desc {
      color: #111827;
      font-weight: 500;
    }

    .activity-time {
      color: #9ca3af;
      font-size: 0.85rem;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .left-sidebar {
        position: relative;
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
      }

      .main-content {
        margin-left: 0;
      }

      .dashboard-container {
        flex-direction: column;
      }

      .welcome-section h1,
      .welcome-section h2 {
        font-size: 2.5rem;
      }

      .action-buttons {
        flex-direction: column;
        align-items: flex-start;
      }

      .btn {
        width: fit-content;
      }
    }

    @media (max-width: 768px) {
      .content-wrapper {
        padding: 2rem;
      }

      .welcome-section h1,
      .welcome-section h2 {
        font-size: 2rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activeSection: string = 'home';
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

  setActiveSection(section: string, event: Event): void {
    event.preventDefault();
    this.activeSection = section;
    console.log(`Navigating to section: ${section}`);
    // Here you can add logic to show different content based on the section
  }
    getSectionDisplayName(section: string): string {
    const sectionNames: { [key: string]: string } = {
      home: 'Dashboard',
      about: 'About',
      services: 'Services',
      projects: 'Projects',
      shop: 'Shop',
      blog: 'Blog',
      contact: 'Contact'
    };
    return sectionNames[section] || 'Home';
  }
}


