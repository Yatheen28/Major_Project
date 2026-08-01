import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

from uuid import uuid4
from sqlalchemy.pool import NullPool

# Create the async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    },
)

# Create an async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Declarative base for ORM models
Base = declarative_base()

# Dependency to get DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
