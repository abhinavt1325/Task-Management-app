from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from src.projects.models import ProjectModel
from src.projects.dtos import ProjectSchema, ProjectUpdateSchema
from src.tasks.models import TaskModel, TaskStatus, TaskPriority
from src.user.models import UserModel

def create_project(body: ProjectSchema, db: Session, user: UserModel):
    new_project = ProjectModel(
        name=body.name.strip(),
        description=body.description.strip() if body.description else "",
        user_id=user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    new_project.task_count = 0
    return new_project

def get_projects(db: Session, user: UserModel):
    # Query projects with task counts for the authenticated user
    projects = db.query(ProjectModel).filter(ProjectModel.user_id == user.id).order_by(ProjectModel.created_at.desc()).all()
    
    # Calculate task counts efficiently
    task_counts = dict(
        db.query(TaskModel.project_id, func.count(TaskModel.id))
        .filter(TaskModel.user_id == user.id, TaskModel.project_id != None)
        .group_by(TaskModel.project_id)
        .all()
    )
    
    for project in projects:
        project.task_count = task_counts.get(project.id, 0)
        
    return projects

def get_one_project(project_id: int, db: Session, user: UserModel):
    project = db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found for this ID!")
    if project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this project!")
    
    # Query tasks for this project
    tasks = db.query(TaskModel).filter(TaskModel.project_id == project.id, TaskModel.user_id == user.id).order_by(TaskModel.created_at.desc()).all()
    for task in tasks:
        if task.status is None:
            task.status = TaskStatus.COMPLETED if task.is_completed else TaskStatus.TODO
        if task.priority is None:
            task.priority = TaskPriority.MEDIUM
            
    project.tasks = tasks
    project.task_count = len(tasks)
    return project

def update_project(project_id: int, body: ProjectUpdateSchema, db: Session, user: UserModel):
    project = db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found for this ID!")
    if project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to update this project!")
    
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        project.name = data["name"].strip()
    if "description" in data and data["description"] is not None:
        project.description = data["description"].strip()
        
    db.add(project)
    db.commit()
    db.refresh(project)
    
    task_count = db.query(TaskModel).filter(TaskModel.project_id == project.id, TaskModel.user_id == user.id).count()
    project.task_count = task_count
    return project

def delete_project(project_id: int, db: Session, user: UserModel):
    project = db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found for this ID!")
    if project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete this project!")
        
    db.delete(project)
    db.commit()
    return None

def get_project_tasks(project_id: int, db: Session, user: UserModel):
    project = db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found for this ID!")
    if project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view tasks for this project!")
        
    tasks = db.query(TaskModel).filter(TaskModel.project_id == project.id, TaskModel.user_id == user.id).order_by(TaskModel.created_at.desc()).all()
    for task in tasks:
        if task.status is None:
            task.status = TaskStatus.COMPLETED if task.is_completed else TaskStatus.TODO
        if task.priority is None:
            task.priority = TaskPriority.MEDIUM
    return tasks
