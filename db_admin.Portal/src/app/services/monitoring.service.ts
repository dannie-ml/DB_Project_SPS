// src/app/services/monitoring.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DatabaseSession {
  sid: number;
  serial: number;
  username: string;
  status: string;
  machine: string;
  program: string;
  logon_time: string;
  last_call_et: number;
}

export interface TablespaceUsage {
  tablespace_name: string;
  total_mb: number;
  used_mb: number;
  free_mb: number;
  usage_percent: number;
}

export interface SqlStatement {
  sql_id: string;
  sql_text_preview: string;
  executions: number;
  elapsed_seconds: number;
  cpu_seconds: number;
  disk_reads: number;
  buffer_gets: number;
  first_load_time: string;
}

export interface DatabaseMetrics {
  database_size_gb: number;
  active_connections: number;
  uptime_hours: number;
  last_updated: string;
}

export interface MonitoringDashboard {
  metrics: DatabaseMetrics;
  sessions: DatabaseSession[];
  tablespaces: TablespaceUsage[];
  top_sql: SqlStatement[];
}

export interface TableData {
  headers: string[];
  rows: any[][];
  total_count: number;
  page: number;
  page_size: number;
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private apiUrl = 'http://localhost:8000/api/monitoring';

  constructor(private http: HttpClient) {}

  /**
   * Get complete monitoring dashboard data
   */
  getMonitoringDashboard(): Observable<MonitoringDashboard> {
    return this.http.get<MonitoringDashboard>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get database sessions in table format
   */
  getDatabaseSessions(page: number = 1, pageSize: number = 20): Observable<TableData> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<TableData>(`${this.apiUrl}/sessions`, { params });
  }

  /**
   * Get tablespace usage in table format
   */
  getTablespaceUsage(page: number = 1, pageSize: number = 20): Observable<TableData> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<TableData>(`${this.apiUrl}/tablespaces`, { params });
  }

  /**
   * Get top SQL statements in table format
   */
  getTopSqlStatements(
    limit: number = 10,
    page: number = 1,
    pageSize: number = 20
  ): Observable<TableData> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<TableData>(`${this.apiUrl}/top-sql`, { params });
  }

  /**
   * Get basic database metrics
   */
  getDatabaseMetrics(): Observable<DatabaseMetrics> {
    return this.http.get<DatabaseMetrics>(`${this.apiUrl}/metrics`);
  }
}
