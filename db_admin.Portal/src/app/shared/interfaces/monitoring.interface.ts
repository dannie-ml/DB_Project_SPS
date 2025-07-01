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
