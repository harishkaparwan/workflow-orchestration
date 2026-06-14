from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from src.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="viewer")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockRequestLog(Base):
    __tablename__ = "stock_request_log"

    order_id = Column(String, primary_key=True, index=True)
    status = Column(String, default="INQUE", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockEntryLog(Base):
    __tablename__ = "stock_entry_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, index=True)
    status = Column(String, default="PROCESS", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
