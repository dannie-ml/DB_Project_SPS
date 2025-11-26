import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../shared/interfaces/auth.interface';

import { MonitoringService } from '../../services/monitoring.service';
import { DatabaseMetrics, TableData } from "../../shared/interfaces/monitoring.interface";
import { DataTableComponent, PaginationEvent } from '../../components/data-table/data-table.component';
import { Subject, takeUntil, interval } from 'rxjs';

// Chart.js types
declare const Chart: any;

// Database Block Interface
interface DatabaseBlock {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  version: string;
  region: string;
  metrics: {
    cpu: number;
    memory: number;
    connections: number;
    latency: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: "dashboard.component.html",
  styleUrl: "dashboard.component.css"
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  currentUser: User | null = null;
  activeSection: string = 'home';
  activeMonitoringTab: string = 'tablespaces'; // Changed default to tablespaces
  sidebarCollapsed: boolean = false; // Sidebar collapse state

  // Database blocks for scalable display
  databases: DatabaseBlock[] = [
    {
      id: 'db1',
      name: 'ORCL_DB_CLUSTER_001',
      status: 'healthy',
      version: 'Oracle 19c',
      region: 'US-East-1',
      metrics: {
        cpu: 45,
        memory: 32,
        connections: 245,
        latency: 12
      }
    },
    {
      id: 'db2',
      name: 'ORCL_DB_CLUSTER_002',
      status: 'warning',
      version: 'Oracle 19c',
      region: 'EU-West-2',
      metrics: {
        cpu: 78,
        memory: 58,
        connections: 412,
        latency: 28
      }
    },
    {
      id: 'db3',
      name: 'ORCL_DB_CLUSTER_003',
      status: 'healthy',
      version: 'Oracle 21c',
      region: 'US-West-1',
      metrics: {
        cpu: 32,
        memory: 24,
        connections: 156,
        latency: 8
      }
    }
  ];

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
    { key: 'tablespaces', label: 'Tablespace Usage' },
    { key: 'sessions', label: 'Database Sessions' },
    { key: 'sql', label: 'Top SQL Statements' }
  ];

  // Chart instances
  private tablespaceChart: any = null;
  private chartsInitialized = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private monitoringService: MonitoringService,
    private router: Router
  ) { }

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

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      if (this.activeSection === 'home' && this.activeMonitoringTab === 'tablespaces') {
        this.initializeCharts();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
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
    this.refreshTablespaces(); // Load tablespaces first since it's the default tab
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

  // Chart initialization
  private initializeCharts(): void {
    if (this.chartsInitialized) return;

    try {
      this.initializeTablespaceChart();
      this.chartsInitialized = true;
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  private initializeTablespaceChart(): void {
    const canvas = document.getElementById('tablespaceChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element "tablespaceChart" not found.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('2D context not available for canvas.');
      return;
    }

    // Destroy existing chart if it exists
    if (this.tablespaceChart) {
      this.tablespaceChart.destroy();
    }

    const chartData = this.getTablespaceChartData();

    // Modern colorful palette
    const colors = [
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#3b82f6'  // Blue
    ];

    this.tablespaceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Used Space (GB)',
          data: chartData.data,
          backgroundColor: colors.slice(0, chartData.data.length),
          borderRadius: 6,
          barThickness: 40,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 16,
            cornerRadius: 12,
            titleFont: {
              size: 14,
              family: 'Inter, sans-serif',
              weight: '600'
            },
            bodyFont: {
              size: 13,
              family: 'SF Mono, Monaco, Consolas, monospace'
            },
            displayColors: false,
            callbacks: {
              label: function (context: any) {
                return context.parsed.y + ' GB';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              },
              color: '#94a3b8'
            },
            border: {
              display: false
            }
          },
          y: {
            grid: {
              color: '#f1f5f9',
              borderDash: [4, 4]
            },
            border: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#cbd5e1',
              callback: function (value: any) {
                return value + ' GB';
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  private getTablespaceChartData(): { labels: string[], data: number[] } {
    if (this.tablespacesData.rows.length > 0) {
      return {
        labels: this.tablespacesData.rows.map(row => String(row[0])), // Tablespace name
        data: this.tablespacesData.rows.map(row => parseFloat(row[2]) || 0) // Used space
      };
    }

    // Default sample data (consider making this look similar to actual data if possible)
    return {
      labels: ['USERS_DATA', 'ANALYTICS_DATA', 'AUDIT_DATA', 'SYSTEM_DATA', 'TEMP_DATA'],
      data: [12.4, 8.7, 3.2, 1.8, 10.2]
    };
  }

  private destroyCharts(): void {
    if (this.tablespaceChart) {
      this.tablespaceChart.destroy();
      this.tablespaceChart = null;
    }
    this.chartsInitialized = false;
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

          if (this.activeSection === 'home' && this.activeMonitoringTab === 'tablespaces') {
            setTimeout(() => {
              this.initializeTablespaceChart(); // Re-initialize chart with new data
            }, 100);
          }
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

    switch (tab) {
      case 'sessions':
        if (this.sessionsData.headers.length === 0) {
          this.refreshSessions();
        }
        break;
      case 'tablespaces':
        if (this.tablespacesData.headers.length === 0) {
          this.refreshTablespaces();
        } else if (this.activeSection === 'home') {
          setTimeout(() => {
            this.initializeCharts(); // Re-initialize chart when switching back to tablespaces
          }, 100);
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

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return this.currentUser.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  trackByDatabaseId(index: number, db: DatabaseBlock): string {
    return db.id;
  }

  setActiveSection(section: string, event: Event): void {
    event.preventDefault();
    this.activeSection = section;

    if (section === 'home' && this.activeMonitoringTab === 'tablespaces') {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }

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

  getTablespaceDescription(tablespaceName: string): string {
    const descriptions: { [key: string]: string } = {
      'USERS_DATA': 'Primary user data storage',
      'ANALYTICS_DATA': 'Analytics and reporting data',
      'AUDIT_DATA': 'Audit logs and security data',
      'SYSTEM_DATA': 'System tables and metadata',
      'TEMP_DATA': 'Temporary data storage',
      'BACKUP_DATA': 'Backup and recovery data',
      'INDEX_DATA': 'Database indexes',
      'LOG_DATA': 'Transaction logs'
    };
    return descriptions[tablespaceName] || 'Database storage';
  }
}
