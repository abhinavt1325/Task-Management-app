import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.utils.db import base

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TaskModel(base):
    __tablename__ = "user_tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(SQLEnum(TaskStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=TaskStatus.TODO, nullable=False, index=True)
    priority = Column(SQLEnum(TaskPriority, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=TaskPriority.MEDIUM, nullable=False, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user_id = Column(Integer, ForeignKey("user_table.id", ondelete="CASCADE"), index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)

    # Relationships
    project = relationship("ProjectModel", back_populates="tasks")