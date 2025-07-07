# app/routers/monitoring.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from datetime import datetime
import pytz

from app.database import get_db
from app.auth.auth import get_current_user
from app.models.models import User
from app.models.monitoring import DatabaseMonitoringService
from app.schemas.monitoring import (
    MonitoringDashboard,
    DatabaseSession,
    TablespaceUsage,
    SqlStatement,
    DatabaseMetrics,
    TableData
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

@router.get("/dashboard", response_model=MonitoringDashboard)
async def get_monitoring_dashboard(
    #current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete monitoring dashboard data"""
    try:
        service = DatabaseMonitoringService()

        # Get all monitoring data
        metrics = service.get_database_metrics(db)
        sessions = service.get_database_sessions(db)
        tablespaces = service.get_tablespace_usage(db)
        top_sql = service.get_top_sql_statements(db, limit=10)

        return MonitoringDashboard(
            metrics=DatabaseMetrics(**metrics),
            sessions=[DatabaseSession(**session) for session in sessions],
            tablespaces=[TablespaceUsage(**ts) for ts in tablespaces],
            top_sql=[SqlStatement(**sql) for sql in top_sql]
        )

    except Exception as e:
        logger.error(f"Error getting monitoring dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving monitoring data")

@router.get("/sessions", response_model=TableData)
async def get_database_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    #current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get database sessions in table format"""
    try:
        service = DatabaseMonitoringService()
        sessions = service.get_database_sessions(db)

        # Pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_sessions = sessions[start_idx:end_idx]

        # Convert to table format
        headers = [
            "SID", "Serial#", "Username", "Status", "Machine",
            "Program", "Logon Time", "Last Call (sec)"
        ]

        rows = []
        for session in paginated_sessions:
            rows.append([
                session['sid'],
                session['serial'],
                session['username'],
                session['status'],
                session['machine'],
                session['program'],
                session['logon_time'].strftime('%Y-%m-%d %H:%M:%S') if session['logon_time'] else '',
                session['last_call_et']
            ])

        return TableData(
            headers=headers,
            rows=rows,
            total_count=len(sessions),
            page=page,
            page_size=page_size
        )

    except Exception as e:
        logger.error(f"Error getting database sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving sessions data")

def to_cdmx_time(dt_utc: datetime) -> str:
    """Convierte el datetime UTC a string con horario de CDMX"""
    if dt_utc is None:
        return ''
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo = pytz.UTC)
    cdmx = pytz.timezone('America/Mexico_City')
    dt_cdmx = dt_utc.astimezone(cdmx)
    return dt_cdmx.strftime("%d/%m/%Y %H:%M:%S")

@router.get("/tablespaces", response_model=TableData)
async def get_tablespace_usage(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    #current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tablespace usage in table format"""
    try:
        service = DatabaseMonitoringService()
        tablespaces = service.get_tablespace_usage(db)

        # Pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_tablespaces = tablespaces[start_idx:end_idx]

        # Convert to table format
        headers = [
            "TBS_NAME", "SIZE_MB", "USED_MB",
            "USED_PCT", "DT_REGISTRO"
        ]

        rows = []
        for ts in paginated_tablespaces:
            ts_str = to_cdmx_time(ts['dt_registro'])
            rows.append([
                ts['tablespace_name'],
                f"{ts['total_mb']:.2f}",
                f"{ts['used_mb']:.2f}",
                f"{ts['usage_percent']:.2f}",
                ts_str
            ])

        return TableData(
            headers=headers,
            rows=rows,
            total_count=len(tablespaces),
            page=page,
            page_size=page_size
        )

    except Exception as e:
        logger.error(f"Error getting tablespace usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving tablespace data")

@router.get("/top-sql", response_model=TableData)
async def get_top_sql_statements(
    limit: int = Query(10, ge=1, le=50),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    #current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get top SQL statements in table format"""
    try:
        service = DatabaseMonitoringService()
        sql_statements = service.get_top_sql_statements(db, limit=limit)

        # Pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_sql = sql_statements[start_idx:end_idx]

        # Convert to table format
        headers = [
            "SQL ID", "SQL Preview", "Executions", "Elapsed (sec)",
            "CPU (sec)", "Disk Reads", "Buffer Gets", "First Load"
        ]

        rows = []
        for sql in paginated_sql:
            rows.append([
                sql['sql_id'],
                sql['sql_text_preview'],
                sql['executions'],
                f"{sql['elapsed_seconds']:.2f}",
                f"{sql['cpu_seconds']:.2f}",
                sql['disk_reads'],
                sql['buffer_gets'],
                sql['first_load_time']
            ])

        return TableData(
            headers=headers,
            rows=rows,
            total_count=len(sql_statements),
            page=page,
            page_size=page_size
        )

    except Exception as e:
        logger.error(f"Error getting top SQL statements: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving SQL data")

@router.get("/metrics")
async def get_database_metrics(
    #current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get basic database metrics"""
    try:
        service = DatabaseMonitoringService()
        metrics = service.get_database_metrics(db)
        return metrics

    except Exception as e:
        logger.error(f"Error getting database metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving metrics")
