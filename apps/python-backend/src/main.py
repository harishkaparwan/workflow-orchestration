import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from faker import Faker
import datetime
import random

from src.database import connect_to_mongo, close_mongo_connection, init_postgres_db, get_db_session, mongodb, engine, Base
from src.models import User, StockRequestLog, StockEntryLog
import uuid

logging.basicConfig(level=logging.INFO)
fake = Faker()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await init_postgres_db()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Automation Hub - Python Backend",
    description="FastAPI backend integrating PostgreSQL and MongoDB",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for the dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Check health of API and database connections."""
    mongo_status = "ok" if mongodb.client else "disconnected"
    return {
        "status": "online",
        "mongodb": mongo_status,
        "postgres": "configured"
    }

@app.post("/api/seed")
async def seed_data(count: int = 100, db: AsyncSession = Depends(get_db_session)):
    """Drops existing data and seeds fake data into Postgres and Mongo."""
    if not db or not mongodb.client:
        raise HTTPException(status_code=500, detail="Database connection missing")

    try:
        # Seed Postgres (Users)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

        users_to_insert = []
        for _ in range(count):
            user = User(
                name=fake.name(),
                email=fake.email(),
                role=random.choice(["admin", "editor", "viewer", "viewer"])
            )
            db.add(user)
            users_to_insert.append(user)
        
        await db.commit()

        # Seed MongoDB (Events)
        events_collection = mongodb.db["events"]
        await events_collection.drop()

        events = []
        for _ in range(count):
            events.append({
                "action": random.choice(["login", "workflow_executed", "settings_changed", "data_exported", "failed_login"]),
                "user": fake.name(),
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
                "ip_address": fake.ipv4(),
                "status": random.choice(["success", "success", "success", "error"])
            })
        await events_collection.insert_many(events)

        return {"message": f"Successfully seeded {count} users into PostgreSQL and {count} events into MongoDB"}
    except Exception as e:
        logging.error(f"Error seeding data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users")
async def get_users(db: AsyncSession = Depends(get_db_session)):
    """Fetch users from Postgres."""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection missing")
    result = await db.execute(select(User).order_by(User.id.desc()))
    users = result.scalars().all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]

@app.get("/api/events")
async def get_events():
    """Fetch events from MongoDB."""
    if not mongodb.client:
        raise HTTPException(status_code=500, detail="Database connection missing")
    events_collection = mongodb.db["events"]
    cursor = events_collection.find({}).sort("timestamp", -1).limit(50)
    events = await cursor.to_list(length=50)
    
    # Format MongoDB _id and dates
    for event in events:
        event["_id"] = str(event["_id"])
    return events

@app.post("/api/seed-orders")
async def seed_orders(db: AsyncSession = Depends(get_db_session)):
    """Seeds test data for Stock (Postgres) and SOS (Mongo) orders."""
    if not db or not mongodb.client:
        raise HTTPException(status_code=500, detail="Database connection missing")
    
    try:
        # --- Seed Postgres (Stock Orders) ---
        # 5 orders INQUE, but only 3 have corresponding PROCESS entry in entry_log. (2 stuck)
        stuck_stock_ids = [str(uuid.uuid4()) for _ in range(2)]
        processed_stock_ids = [str(uuid.uuid4()) for _ in range(3)]
        
        for oid in stuck_stock_ids + processed_stock_ids:
            db.add(StockRequestLog(order_id=oid, status="INQUE"))
            
        for oid in processed_stock_ids:
            db.add(StockEntryLog(order_id=oid, status="PROCESS"))
            
        await db.commit()
        
        # --- Seed MongoDB (SOS Orders) ---
        # 5 orders INQUE, but only 3 have corresponding PROCESS entry in entry_log. (2 stuck)
        sos_request = mongodb.db["sos_request_log"]
        sos_entry = mongodb.db["sos_entry_log"]
        
        await sos_request.delete_many({})
        await sos_entry.delete_many({})
        
        stuck_sos_ids = [str(uuid.uuid4()) for _ in range(2)]
        processed_sos_ids = [str(uuid.uuid4()) for _ in range(3)]
        
        req_logs = [{"order_id": oid, "status": "INQUE", "created_at": datetime.datetime.now(datetime.timezone.utc)} for oid in stuck_sos_ids + processed_sos_ids]
        entry_logs = [{"order_id": oid, "status": "PROCESS", "created_at": datetime.datetime.now(datetime.timezone.utc)} for oid in processed_sos_ids]
        
        if req_logs: await sos_request.insert_many(req_logs)
        if entry_logs: await sos_entry.insert_many(entry_logs)
        
        return {
            "message": "Seeded successfully",
            "postgres_stuck_orders": stuck_stock_ids,
            "mongodb_stuck_orders": stuck_sos_ids
        }
        
    except Exception as e:
        logging.error(f"Error seeding orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))
