# app/schemas/monitoring.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Union

class DatabaseSession(BaseModel):
    sid: int
    serial: int
    username: str
    status: str
    machine: str
    program: str
    logon_time: datetime
    last_call_et: int

class TablespaceUsage(BaseModel):
    tbs_name: str
    size_mb: float
    used_mb: float
    used_pct: float
    dt_registro: str  # o datetime, si lo parseas

class SqlStatement(BaseModel):
    sql_id: str
    sql_text_preview: str
    executions: int
    elapsed_seconds: float
    cpu_seconds: float
    disk_reads: int
    buffer_gets: int
    first_load_time: str

class DatabaseMetrics(BaseModel):
    database_size_gb: float
    active_connections: int
    uptime_hours: float
    last_updated: datetime

class MonitoringDashboard(BaseModel):
    metrics: DatabaseMetrics
    sessions: List[DatabaseSession]
    tablespaces: List[TablespaceUsage]
    top_sql: List[SqlStatement]

class TableData(BaseModel):
    headers: List[str]
    rows: List[List[Union[str, datetime]]]
    total_count: int
    page: int
    page_size: int
