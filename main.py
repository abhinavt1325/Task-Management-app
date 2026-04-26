from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.utils.db import base, engine
from src.tasks.router import task_routes 
from src.user.router import user_routes

base.metadata.create_all(engine)

app = FastAPI(title="My Task management application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_routes)
app.include_router(user_routes)