from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import ssl

def _make_engine():
    url = settings.async_database_url
    # Only use SSL for remote connections (not localhost/127.0.0.1)
    is_local = "localhost" in url or "127.0.0.1" in url
    if is_local:
        return create_async_engine(url, echo=False, pool_pre_ping=True)
    ssl_ctx = ssl.create_default_context()
    return create_async_engine(url, echo=False, pool_pre_ping=True, connect_args={"ssl": ssl_ctx})

engine = _make_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
