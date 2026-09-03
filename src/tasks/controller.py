from datetime import datetime, timezone, time
from typing import Optional
from sqlalchemy import case, nullslast, asc, desc
from src.tasks.dtos import TaskSchema, TaskUpdateSchema
from sqlalchemy.orm import Session
from src.tasks.models import TaskModel, TaskStatus, TaskPriority
from src.projects.models import ProjectModel
from fastapi import HTTPException
from src.user.models import UserModel

def create_task(body: TaskSchema, db: Session, user: UserModel):
    data = body.model_dump()
    
    # Handle status & is_completed synchronization safely
    status = data.get("status") or TaskStatus.TODO
    is_completed = data.get("is_completed")
    
    if is_completed is not None:
        if is_completed and status != TaskStatus.COMPLETED:
            status = TaskStatus.COMPLETED
        elif not is_completed and status == TaskStatus.COMPLETED:
            status = TaskStatus.TODO
    else:
        is_completed = (status == TaskStatus.COMPLETED)

    priority = data.get("priority") or TaskPriority.MEDIUM
    due_date = data.get("due_date")
    project_id = data.get("project_id")

    # Validate project ownership
    if project_id is not None:
        project = db.get(ProjectModel, project_id)
        if not project or project.user_id != user.id:
            raise HTTPException(status_code=403, detail="You cannot assign a task to a project that does not belong to you!")

    new_task = TaskModel(
        title=data["title"],
        description=data["description"],
        status=status,
        priority=priority,
        due_date=due_date,
        is_completed=is_completed,
        user_id=user.id,
        project_id=project_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task

def get_tasks(
    db: Session,
    user: UserModel,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    due_filter: Optional[str] = None,
    sort_by: Optional[str] = "newest",
    project_id: Optional[int] = None
):
    query = db.query(TaskModel).filter(TaskModel.user_id == user.id)

    # 0. Project Filter
    if project_id is not None:
        query = query.filter(TaskModel.project_id == project_id)

    # 1. Status Filter
    if status is not None:
        query = query.filter(TaskModel.status == status)

    # 2. Priority Filter
    if priority is not None:
        query = query.filter(TaskModel.priority == priority)

    # 3. Due Date Filter
    if due_filter:
        df = due_filter.strip().lower()
        now = datetime.now(timezone.utc)
        start_of_today = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
        end_of_today = datetime.combine(now.date(), time.max).replace(tzinfo=timezone.utc)

        if df in ("overdue", "is_overdue"):
            query = query.filter(
                TaskModel.due_date != None,
                TaskModel.due_date < start_of_today,
                TaskModel.status != TaskStatus.COMPLETED
            )
        elif df in ("due_today", "today"):
            query = query.filter(
                TaskModel.due_date != None,
                TaskModel.due_date >= start_of_today,
                TaskModel.due_date <= end_of_today
            )

    # 4. Sorting
    sort_val = (sort_by or "newest").strip().lower()
    if sort_val in ("oldest", "created_asc", "asc"):
        query = query.order_by(TaskModel.created_at.asc(), TaskModel.id.asc())
    elif sort_val in ("due_date", "due_asc", "due"):
        query = query.order_by(nullslast(TaskModel.due_date.asc()), TaskModel.created_at.desc())
    elif sort_val in ("priority", "priority_high"):
        priority_order = case(
            (TaskModel.priority == TaskPriority.HIGH, 1),
            (TaskModel.priority == TaskPriority.MEDIUM, 2),
            (TaskModel.priority == TaskPriority.LOW, 3),
            else_=4
        )
        query = query.order_by(priority_order, TaskModel.created_at.desc())
    else:  # "newest", "created_desc", default
        query = query.order_by(TaskModel.created_at.desc(), TaskModel.id.desc())

    tasks = query.all()
    for task in tasks:
        if task.status is None:
            task.status = TaskStatus.COMPLETED if task.is_completed else TaskStatus.TODO
        if task.priority is None:
            task.priority = TaskPriority.MEDIUM
    return tasks

def get_one_task(task_id: int, db: Session, user: UserModel):
    one_task = db.get(TaskModel, task_id)
    if not one_task:
        raise HTTPException(status_code=404, detail="Task not found for this ID!")
    if one_task.user_id != user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view this task!")
    if one_task.status is None:
        one_task.status = TaskStatus.COMPLETED if one_task.is_completed else TaskStatus.TODO
    if one_task.priority is None:
        one_task.priority = TaskPriority.MEDIUM
    return one_task

def update_task(task_id: int, body: TaskUpdateSchema, db: Session, user: UserModel):
    one_task: TaskModel = db.get(TaskModel, task_id)
    if not one_task:
        raise HTTPException(status_code=404, detail="Task not found for this ID!")
    if one_task.user_id != user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to update this task!")
    
    body_data = body.model_dump(exclude_unset=True)
    if not body_data:
        if one_task.status is None:
            one_task.status = TaskStatus.COMPLETED if one_task.is_completed else TaskStatus.TODO
        if one_task.priority is None:
            one_task.priority = TaskPriority.MEDIUM
        return one_task
    
    # Synchronize status and is_completed safely
    if "status" in body_data and "is_completed" not in body_data:
        body_data["is_completed"] = (body_data["status"] == TaskStatus.COMPLETED)
    elif "is_completed" in body_data and "status" not in body_data:
        if body_data["is_completed"]:
            body_data["status"] = TaskStatus.COMPLETED
        elif one_task.status == TaskStatus.COMPLETED:
            body_data["status"] = TaskStatus.TODO
    # Validate project ownership if updating project_id
    if "project_id" in body_data and body_data["project_id"] is not None:
        project = db.get(ProjectModel, body_data["project_id"])
        if not project or project.user_id != user.id:
            raise HTTPException(status_code=403, detail="You cannot assign a task to a project that does not belong to you!")

    for field, value in body_data.items():
        setattr(one_task, field, value)
        
    db.add(one_task)
    db.commit()
    db.refresh(one_task)
    
    if one_task.status is None:
        one_task.status = TaskStatus.COMPLETED if one_task.is_completed else TaskStatus.TODO
    if one_task.priority is None:
        one_task.priority = TaskPriority.MEDIUM
        
    return one_task

def delete_task(task_id: int, db: Session, user: UserModel):
    one_task: TaskModel = db.get(TaskModel, task_id)
    if not one_task:
        raise HTTPException(status_code=404, detail="Task not found for this ID!")
    if one_task.user_id != user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to delete this task!")

    db.delete(one_task)
    db.commit()
    return None