from fastapi import APIRouter, Depends, status, Query
from src.tasks import controller
from src.tasks.dtos import TaskSchema, TaskUpdateSchema, TaskResponseSchema
from src.tasks.models import TaskStatus, TaskPriority
from src.utils.db import get_db
from typing import List, Optional
from sqlalchemy.orm import Session
from src.utils.helpers import is_authenticated
from src.user.models import UserModel

task_routes = APIRouter(prefix="/tasks")

@task_routes.post("/create", response_model=TaskResponseSchema, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskSchema, db: Session = Depends(get_db), user: UserModel = Depends(is_authenticated)):
    return controller.create_task(body, db, user)

@task_routes.get("", response_model=List[TaskResponseSchema], status_code=status.HTTP_200_OK)
@task_routes.get("/", response_model=List[TaskResponseSchema], status_code=status.HTTP_200_OK)
@task_routes.get("/all_tasks", response_model=List[TaskResponseSchema], status_code=status.HTTP_200_OK)
def get_all_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter tasks by status (TODO, IN_PROGRESS, COMPLETED)"),
    priority: Optional[TaskPriority] = Query(None, description="Filter tasks by priority (LOW, MEDIUM, HIGH)"),
    due_filter: Optional[str] = Query(None, description="Filter by due date ('overdue', 'due_today', 'all')"),
    sort_by: Optional[str] = Query("newest", description="Sort tasks by ('newest', 'oldest', 'due_date', 'priority')"),
    sort: Optional[str] = Query(None, description="Alias for sort_by"),
    project_id: Optional[int] = Query(None, description="Filter tasks by project ID"),
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated)
):
    active_sort = sort or sort_by or "newest"
    return controller.get_tasks(
        db=db,
        user=user,
        status=status,
        priority=priority,
        due_filter=due_filter,
        sort_by=active_sort,
        project_id=project_id
    )

@task_routes.get("/task_id/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
@task_routes.get("/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
def get_one_task(task_id: int, db: Session = Depends(get_db), user: UserModel = Depends(is_authenticated)):
    return controller.get_one_task(task_id, db, user)

@task_routes.put("/update_task/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
@task_routes.patch("/update_task/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
@task_routes.put("/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
@task_routes.patch("/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
def update_task(task_id: int, body: TaskUpdateSchema, db: Session = Depends(get_db), user: UserModel = Depends(is_authenticated)):
    return controller.update_task(task_id, body, db, user)

@task_routes.delete("/delete_task/{task_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
@task_routes.delete("/{task_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), user: UserModel = Depends(is_authenticated)):
    return controller.delete_task(task_id, db, user)