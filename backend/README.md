# Astemari Backend — FastAPI

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configure

Copy `.env` and update your PostgreSQL credentials:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/astemari_db
SECRET_KEY=your-secret-key-min-32-chars
```

## Database

```bash
# Create DB first in PostgreSQL, then:
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs
