// src/app/services/monitoring.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseMetrics, MonitoringDashboard, TableData } from '../shared/interfaces/monitoring.interface';


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

