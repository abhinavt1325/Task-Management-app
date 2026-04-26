from pydantic import BaseModel
from pydantic import ConfigDict

class UserSchema(BaseModel):
    name: str
    username: str
    email: str
    password: str

class UserResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    username: str
    email: str

class LoginSchema(BaseModel):
    username: str
    password: str