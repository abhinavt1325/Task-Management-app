from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
from src.tasks.dtos import TaskResponseSchema

class ProjectSchema(BaseModel):
    name: str = Field(..., min_length=1, description="Project name cannot be empty")
    description: Optional[str] = Field(default="", description="Project description")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Project name cannot be blank or only whitespace")
        return v.strip()

class ProjectUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Project name cannot be blank or only whitespace")
            return v.strip()
        return v

class ProjectResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: Optional[int] = None
    task_count: Optional[int] = 0

class ProjectDetailResponseSchema(ProjectResponseSchema):
    tasks: List[TaskResponseSchema] = []
