from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from src.utils.db import base

class TaskModel(base):
    __tablename__="user_tasks"
    id=Column(Integer, primary_key=True, index=True)
    title=Column(String, nullable=False)
    description=Column(String, nullable=False)
    is_completed=Column(Boolean, default=False)
    user_id=Column(Integer, ForeignKey("user_table.id", ondelete="CASCADE"))