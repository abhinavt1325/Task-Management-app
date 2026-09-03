from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from src.tasks.models import TaskStatus, TaskPriority

class TaskSchema(BaseModel):
    title: str = Field(..., min_length=1, description="Task title cannot be empty")
    description: str = Field(..., min_length=1, description="Task description cannot be empty")
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    project_id: Optional[int] = None

    @field_validator('title', 'description')
    @classmethod
    def validate_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be blank or only whitespace")
        return v.strip()

class TaskUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    project_id: Optional[int] = None

    @field_validator('title', 'description')
    @classmethod
    def validate_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Field cannot be blank or only whitespace")
            return v.strip()
        return v

class TaskResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: Optional[int] = None
    project_id: Optional[int] = None