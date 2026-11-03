from pydantic import BaseModel, EmailStr, Field, field_validator


def validate_bcrypt_password(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    return value


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=72)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

    _validate_password = field_validator("password")(validate_bcrypt_password)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    _validate_password = field_validator("password")(validate_bcrypt_password)

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
