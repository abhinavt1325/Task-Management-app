from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from src.tasks.router import task_routes 
from src.user.router import user_routes
from src.projects.router import project_routes

# Create any missing tables
base.metadata.create_all(engine)

# Ensure columns exist on PostgreSQL/SQLite if tables existed beforehand
try:
    with engine.connect() as conn:
        columns = [
            "ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'TODO';",
            "ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS priority VARCHAR DEFAULT 'MEDIUM';",
            "ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS user_id INTEGER;",
            "ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS project_id INTEGER;"
        ]
        for col_sql in columns:
            try:
                conn.execute(text(col_sql))
                conn.commit()
            except Exception:
                pass
except Exception as e:
    print(f"Database schema auto-migration notice: {e}")

app = FastAPI(title="My Task management application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://task-management-app-amber-two.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_routes)
app.include_router(user_routes)
app.include_router(project_routes)