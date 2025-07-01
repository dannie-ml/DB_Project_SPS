// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { MonitoringService, DatabaseMetrics, TableData } from '../../services/monitoring.service';
import { DataTableComponent, PaginationEvent } from '../../components/data-table/data-table.component';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
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
          <a href="#" class="nav-item" [class.active]="activeSection === 'home'" (click)="setActiveSection('home', $event)">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Dashboard de Monitoreo (HC)</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'about'" (click)="setActiveSection('about', $event)">
            <span class="nav-icon">👤</span>
            <span class="nav-text">Gestión de tickets y/o registros</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'services'" (click)="setActiveSection('services', $event)">
            <span class="nav-icon">💼</span>
            <span class="nav-text">Gestión de usuarios</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'projects'" (click)="setActiveSection('projects', $event)">
            <span class="nav-icon">💻</span>
            <span class="nav-text">Accesos a las bases de datos</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'shop'" (click)="setActiveSection('shop', $event)">
            <span class="nav-icon">🛒</span>
            <span class="nav-text">Inventarios de bases de datos</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'blog'" (click)="setActiveSection('blog', $event)">
            <span class="nav-icon">📝</span>
            <span class="nav-text">Documentación / Guías de bases de datos</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'contact'" (click)="setActiveSection('contact', $event)">
            <span class="nav-icon">✉️</span>
            <span class="nav-text">Reportes / Análisis</span>
          </a>
          <a href="#" class="nav-item" [class.active]="activeSection === 'auditorias'" (click)="setActiveSection('auditorias', $event)">
            <span class="nav-icon">🔍</span>
            <span class="nav-text">Generación de archivos de auditorías</span>
          </a>
        </nav>

        <!-- Sidebar Footer -->
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
              <button class="btn btn-primary" (click)="refreshAllData()">Get Report</button>
              <button class="btn btn-secondary" (click)="refreshMetrics()">Analyze</button>
            </div>
          </div>

          <!-- Real-time Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <h3>Active Connections</h3>
                <p class="stat-number">{{ dbMetrics?.active_connections || 0 }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💾</div>
              <div class="stat-info">
                <h3>Database Size</h3>
                <p class="stat-number">{{ (dbMetrics?.database_size_gb || 0) | number:'1.1-1' }} GB</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔄</div>
              <div class="stat-info">
                <h3>Uptime</h3>
                <p class="stat-number">{{ (dbMetrics?.uptime_hours || 0) | number:'1.0-0' }}h</p>
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

          <!-- Monitoring Tables Section -->
          <div class="monitoring-section" *ngIf="activeSection === 'home'">
            <div class="section-header">
              <h2>Real-time Database Monitoring</h2>
              <div class="monitoring-controls">
                <button class="toggle-btn"
                        [class.active]="autoRefresh"
                        (click)="toggleAutoRefresh()">
                  <span>{{ autoRefresh ? '⏸️' : '▶️' }}</span>
                  Auto Refresh
                </button>
                <span class="last-updated" *ngIf="dbMetrics?.last_updated">
                  Last updated: {{ dbMetrics?.last_updated | date:'medium' }}
                </span>
              </div>
            </div>

            <!-- Tab Navigation -->
            <div class="tab-navigation">
              <button
                *ngFor="let tab of monitoringTabs"
                class="tab-btn"
                [class.active]="activeMonitoringTab === tab.key"
                (click)="setActiveMonitoringTab(tab.key)">
                {{ tab.label }}
              </button>
            </div>

            <!-- Database Sessions Table -->
            <div *ngIf="activeMonitoringTab === 'sessions'">
              <app-data-table
                title="Database Sessions"
                [headers]="sessionsData.headers"
                [rows]="sessionsData.rows"
                [loading]="loadingStates.sessions"
                [error]="errorStates.sessions"
                [totalCount]="sessionsData.total_count"
                [currentPage]="sessionsData.page"
                [pageSize]="sessionsData.page_size"
                [sortable]="true"
                [columnTypes]="['number', 'number', 'text', 'text', 'text', 'text', 'date', 'number']"
                (refresh)="refreshSessions()"
                (pageChange)="onSessionsPageChange($event)">
              </app-data-table>
            </div>

            <!-- Tablespace Usage Table -->
            <div *ngIf="activeMonitoringTab === 'tablespaces'">
              <app-data-table
                title="Tablespace Usage"
                [headers]="tablespacesData.headers"
                [rows]="tablespacesData.rows"
                [loading]="loadingStates.tablespaces"
                [error]="errorStates.tablespaces"
                [totalCount]="tablespacesData.total_count"
                [currentPage]="tablespacesData.page"
                [pageSize]="tablespacesData.page_size"
                [sortable]="true"
                [columnTypes]="['text', 'number', 'number', 'number', 'percentage']"
                (refresh)="refreshTablespaces()"
                (pageChange)="onTablespacesPageChange($event)">
              </app-data-table>
            </div>

            <!-- Top SQL Statements Table -->
            <div *ngIf="activeMonitoringTab === 'sql'">
              <app-data-table
                title="Top SQL Statements"
                [headers]="sqlData.headers"
                [rows]="sqlData.rows"
                [loading]="loadingStates.sql"
                [error]="errorStates.sql"
                [totalCount]="sqlData.total_count"
                [currentPage]="sqlData.page"
                [pageSize]="sqlData.page_size"
                [sortable]="true"
                [columnTypes]="['text', 'text', 'number', 'number', 'number', 'number', 'number', 'text']"
                (refresh)="refreshTopSql()"
                (pageChange)="onSqlPageChange($event)">
              </app-data-table>
            </div>
          </div>

          <!-- Selected Projects Section (only show when not in monitoring) -->
          <div class="projects-section" *ngIf="activeSection !== 'home'">
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
          <div class="recent-activity" *ngIf="activeSection !== 'home'">
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
      font-family: 'JetBrains Mono', monospace;
    }

    /* Monitoring Section */
    .monitoring-section {
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

    .monitoring-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .toggle-btn:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .toggle-btn.active {
      background: #22c55e;
      border-color: #22c55e;
      color: white;
    }

    .last-updated {
      font-size: 0.75rem;
      color: #9ca3af;
      font-style: italic;
    }

    .tab-navigation {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 2rem;
      gap: 0.5rem;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 2px solid transparent;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
    }

    .tab-btn:hover {
      color: #111827;
      background: #f9fafb;
    }

    .tab-btn.active {
      color: #111827;
      border-bottom-color: #3b82f6;
      background: #f9fafb;
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

    /* Projects Section */
    .projects-section {
      margin-bottom: 4rem;
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

      .monitoring-controls {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .tab-navigation {
        flex-wrap: wrap;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activeSection: string = 'home';
  activeMonitoringTab: string = 'sessions';

  // Database metrics
  dbMetrics: DatabaseMetrics | null = null;

  // Table data
  sessionsData: TableData = this.getEmptyTableData();
  tablespacesData: TableData = this.getEmptyTableData();
  sqlData: TableData = this.getEmptyTableData();

  // Loading states
  loadingStates = {
    sessions: false,
    tablespaces: false,
    sql: false,
    metrics: false
  };

  // Error states
  errorStates = {
    sessions: '',
    tablespaces: '',
    sql: '',
    metrics: ''
  };

  // Auto refresh
  autoRefresh = false;
  refreshInterval = 30000; // 30 seconds

  // Monitoring tabs
  monitoringTabs = [
    { key: 'sessions', label: 'Database Sessions' },
    { key: 'tablespaces', label: 'Tablespace Usage' },
    { key: 'sql', label: 'Top SQL Statements' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private monitoringService: MonitoringService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.router.navigate(['/']);
        } else {
          // Load initial data when user is authenticated
          this.loadInitialData();
        }
      });

    // Setup auto refresh
    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoRefresh && this.currentUser) {
          this.refreshCurrentTab();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getEmptyTableData(): TableData {
    return {
      headers: [],
      rows: [],
      total_count: 0,
      page: 1,
      page_size: 20
    };
  }

  private loadInitialData(): void {
    this.refreshMetrics();
    this.refreshSessions();
  }

  private refreshCurrentTab(): void {
    switch (this.activeMonitoringTab) {
      case 'sessions':
        this.refreshSessions();
        break;
      case 'tablespaces':
        this.refreshTablespaces();
        break;
      case 'sql':
        this.refreshTopSql();
        break;
    }
    this.refreshMetrics();
  }

  // Data refresh methods
  refreshMetrics(): void {
    this.loadingStates.metrics = true;
    this.errorStates.metrics = '';

    this.monitoringService.getDatabaseMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.dbMetrics = metrics;
          this.loadingStates.metrics = false;
        },
        error: (error) => {
          this.errorStates.metrics = 'Failed to load database metrics';
          this.loadingStates.metrics = false;
          console.error('Error loading metrics:', error);
        }
      });
  }

  refreshSessions(page: number = 1, pageSize: number = 20): void {
    this.loadingStates.sessions = true;
    this.errorStates.sessions = '';

    this.monitoringService.getDatabaseSessions(page, pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sessionsData = data;
          this.loadingStates.sessions = false;
        },
        error: (error) => {
          this.errorStates.sessions = 'Failed to load database sessions';
          this.loadingStates.sessions = false;
          console.error('Error loading sessions:', error);
        }
      });
  }

  refreshTablespaces(page: number = 1, pageSize: number = 20): void {
    this.loadingStates.tablespaces = true;
    this.errorStates.tablespaces = '';

    this.monitoringService.getTablespaceUsage(page, pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tablespacesData = data;
          this.loadingStates.tablespaces = false;
        },
        error: (error) => {
          this.errorStates.tablespaces = 'Failed to load tablespace usage';
          this.loadingStates.tablespaces = false;
          console.error('Error loading tablespaces:', error);
        }
      });
  }

  refreshTopSql(page: number = 1, pageSize: number = 20): void {
    this.loadingStates.sql = true;
    this.errorStates.sql = '';

    this.monitoringService.getTopSqlStatements(10, page, pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sqlData = data;
          this.loadingStates.sql = false;
        },
        error: (error) => {
          this.errorStates.sql = 'Failed to load SQL statements';
          this.loadingStates.sql = false;
          console.error('Error loading SQL statements:', error);
        }
      });
  }

  refreshAllData(): void {
    this.refreshMetrics();
    this.refreshSessions();
    this.refreshTablespaces();
    this.refreshTopSql();
  }

  // Event handlers
  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
  }

  setActiveMonitoringTab(tab: string): void {
    this.activeMonitoringTab = tab;

    // Load data for the selected tab if not already loaded
    switch (tab) {
      case 'sessions':
        if (this.sessionsData.headers.length === 0) {
          this.refreshSessions();
        }
        break;
      case 'tablespaces':
        if (this.tablespacesData.headers.length === 0) {
          this.refreshTablespaces();
        }
        break;
      case 'sql':
        if (this.sqlData.headers.length === 0) {
          this.refreshTopSql();
        }
        break;
    }
  }

  onSessionsPageChange(event: PaginationEvent): void {
    this.refreshSessions(event.page, event.pageSize);
  }

  onTablespacesPageChange(event: PaginationEvent): void {
    this.refreshTablespaces(event.page, event.pageSize);
  }

  onSqlPageChange(event: PaginationEvent): void {
    this.refreshTopSql(event.page, event.pageSize);
  }

  logout(): void {
    this.authService.logout();
  }

  setActiveSection(section: string, event: Event): void {
    event.preventDefault();
    this.activeSection = section;
    console.log(`Navigating to section: ${section}`);
  }

  getSectionDisplayName(section: string): string {
    const sectionNames: { [key: string]: string } = {
      home: 'Dashboard de Monitoreo (HC)',
      about: 'Gestión de tickets y/o registros',
      services: 'Gestión de usuarios',
      projects: 'Accesos a las bases de datos',
      shop: 'Inventarios de bases de datos',
      blog: 'Documentación / Guías de bases de datos',
      contact: 'Reportes / Análisis',
      auditorias: 'Generación de archivos de auditorías',
    };
    return sectionNames[section] || 'Home';
  }
}
