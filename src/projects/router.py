from fastapi import APIRouter, Depends, status
from typing import List
from sqlalchemy.orm import Session
from src.utils.db import get_db
from src.utils.helpers import is_authenticated
from src.user.models import UserModel
from src.projects import controller
from src.projects.dtos import (
    ProjectSchema,
    ProjectUpdateSchema,
    ProjectResponseSchema,
    ProjectDetailResponseSchema
)
from src.tasks.dtos import TaskResponseSchema

project_routes = APIRouter(prefix="/projects")

@project_routes.post("/create", response_model=ProjectResponseSchema, status_code=status.HTTP_201_CREATED)
@project_routes.post("", response_model=ProjectResponseSchema, status_code=status.HTTP_201_CREATED)
@project_routes.post("/", response_model=ProjectResponseSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectSchema,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    return controller.create_project(body, db, user)

@project_routes.get("/all_projects", response_model=List[ProjectResponseSchema], status_code=status.HTTP_200_OK)
@project_routes.get("", response_model=List[ProjectResponseSchema], status_code=status.HTTP_200_OK)
@project_routes.get("/", response_model=List[ProjectResponseSchema], status_code=status.HTTP_200_OK)
def get_projects(
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    return controller.get_projects(db, user)

@project_routes.get("/{project_id}", response_model=ProjectDetailResponseSchema, status_code=status.HTTP_200_OK)
def get_one_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    return controller.get_one_project(project_id, db, user)

@project_routes.put("/update_project/{project_id}", response_model=ProjectResponseSchema, status_code=status.HTTP_200_OK)
@project_routes.put("/{project_id}", response_model=ProjectResponseSchema, status_code=status.HTTP_200_OK)
@project_routes.patch("/update_project/{project_id}", response_model=ProjectResponseSchema, status_code=status.HTTP_200_OK)
@project_routes.patch("/{project_id}", response_model=ProjectResponseSchema, status_code=status.HTTP_200_OK)
def update_project(
    project_id: int,
    body: ProjectUpdateSchema,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    return controller.update_project(project_id, body, db, user)

@project_routes.delete("/delete_project/{project_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
@project_routes.delete("/{project_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    return controller.delete_project(project_id, db, user)

@project_routes.get("/{project_id}/tasks", response_model=List[TaskResponseSchema], status_code=status.HTTP_200_OK)
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    return controller.get_project_tasks(project_id, db, user)
