from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


def validate_bcrypt_password(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    return value


class UserRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=12, max_length=72)
    first_name: Name
    last_name: Name

    _validate_password = field_validator("password")(validate_bcrypt_password)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().casefold()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not any(character.isupper() for character in value):
            raise ValueError("Password must include an uppercase letter")
        if not any(character.islower() for character in value):
            raise ValueError("Password must include a lowercase letter")
        if not any(not character.isalnum() and not character.isspace() for character in value):
            raise ValueError("Password must include a special character")
        return value

class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    _validate_password = field_validator("password")(validate_bcrypt_password)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().casefold()

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str


class SessionResponse(BaseModel):
    user: UserResponse
    csrf_token: str
