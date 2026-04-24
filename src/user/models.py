from sqlalchemy import Column, Integer, String, Boolean, DateTime
from src.utils.db import base

class UserModel(base):
    __tablename__="user_table"
    id=Column(Integer, primary_key=True)
    name=Column(String, nullable=False)
    username=Column(String, nullable=False, unique=True)
    email=Column(String, nullable=False, unique=True)
    hash_password=Column(String, nullable=False)
