from fastapi import FastAPI
from src.utils.db import base, engine
from src.tasks.router import task_routes 
from src.user.router import user_routes

base.metadata.create_all(engine)

app = FastAPI(title="My Task management application")
app.include_router(task_routes)
app.include_router(user_routes)