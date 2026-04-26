from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from src.utils.settings import settings

base=declarative_base()
engine = create_engine(settings.DB_CONNECTION, pool_pre_ping=True)
LocalSession=sessionmaker(bind=engine)

def get_db():
    session=LocalSession()
    try:
        yield session
    finally:
        session.close()
