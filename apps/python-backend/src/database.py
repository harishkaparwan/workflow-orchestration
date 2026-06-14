import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

logger = logging.getLogger(__name__)

# --- MongoDB Setup ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "automation_hub")

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

mongodb = MongoDB()

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB at {MONGO_URI}")
        mongodb.client = AsyncIOMotorClient(MONGO_URI)
        mongodb.db = mongodb.client[MONGO_DB_NAME]
        # Verify connection
        await mongodb.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")

async def close_mongo_connection():
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed.")

# --- PostgreSQL Setup ---
PGUSER = os.getenv("PGUSER", "localadmin")
PGPASSWORD = os.getenv("PGPASSWORD", "localadmin")
PGHOST = os.getenv("PGHOST", "postgres")
PGPORT = os.getenv("PGPORT", "5432")
PGDATABASE = os.getenv("PGDATABASE", "hercules")

# Construct the SQLAlchemy asyncpg URI
POSTGRES_URI = os.getenv(
    "POSTGRES_URI", 
    f"postgresql+asyncpg://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}"
)

try:
    engine = create_async_engine(POSTGRES_URI, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    Base = declarative_base()
except Exception as e:
    logger.error(f"Failed to initialize PostgreSQL engine: {e}")
    engine = None
    async_session = None
    Base = None

async def init_postgres_db():
    if engine is None:
        return
    try:
        async with engine.begin() as conn:
            # Create tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL tables initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL database: {e}")

async def get_db_session():
    if not async_session:
        yield None
        return
    async with async_session() as session:
        yield session
