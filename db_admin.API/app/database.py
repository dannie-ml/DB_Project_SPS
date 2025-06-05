# Librerias

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config
import oracledb

# Configuración de la base de datos Oracle

ORACLE_USER = config('ORACLE_USER', default ='APPUSER')
ORACLE_PASSWORD = config('ORACLE_PASSWORD', default = 'ORACLE')
ORACLE_HOST = config('ORACLE_HOST', default = '0.0.0.0')
ORACLE_PORT = config('ORACLE_PORT', default = '1521')
ORACLE_SERVICE = config('ORACLE_SERVICE', default = 'FREEPDB1')

# Cadena de conexión Oracle

DATABASE_URL = (
    f'oracle+oracledb://{ORACLE_USER}:{ORACLE_PASSWORD}'
    f'@localhost:1521/?service_name=FREEPDB1'
)

# Crea el engine

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping = True,
    pool_recycle = 3600,
    echo = False
)

SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)
Base = declarative_base()

def get_db():
    """ Dependencia para obtener la sesión de la base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
