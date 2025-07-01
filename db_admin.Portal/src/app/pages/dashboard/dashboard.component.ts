// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../shared/interfaces/auth.interface';

import { MonitoringService,  } from '../../services/monitoring.service';
import { DatabaseMetrics, TableData } from "../../shared/interfaces/monitoring.interface";
import { DataTableComponent, PaginationEvent } from '../../components/data-table/data-table.component';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: "dashboard.component.html",
  styleUrl: "dashboard.component.css"
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
