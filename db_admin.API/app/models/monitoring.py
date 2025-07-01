# app/models/monitoring_alternative.py
from sqlalchemy import Column, Integer, String, Float, DateTime, text
from sqlalchemy.orm import Session
from app.database import Base, engine
from datetime import datetime
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DatabaseMonitoringService:
    def get_tablespace_usage(self, db: Session):
        sql = """
          SELECT
            TBS_NAME   AS tablespace_name,
            SIZE_MB    AS total_mb,
            USED_MB    AS used_mb,
            USED_PCT   AS usage_percent,
            DT_REGISTRO AS dt_registro
          FROM appuser.TBS_USAGE_REPORT
          ORDER BY dt_registro DESC
        """
        result = db.execute(text(sql))
        # cada row._mapping es un Mapping con claves en minúsculas tal como aliasaste
        return [dict(r._mapping) for r in result]
