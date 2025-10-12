from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.user import UserRole, Permission

# === USER SCHEMAS ===

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True
    branch_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    branch_id: Optional[int] = None
    password: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v and len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserResponse(UserBase):
    id: int
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    permissions: List[str]  # List of permission strings
    
    class Config:
        from_attributes = True
        
    @validator('permissions', pre=True)
    def extract_permissions(cls, v):
        if hasattr(v, '__iter__') and not isinstance(v, str):
            return [perm.value if hasattr(perm, 'value') else str(perm) for perm in v]
        return v

class UserProfile(BaseModel):
    """Perfil público del usuario (sin información sensible)"""
    id: int
    username: str
    full_name: str
    role: UserRole
    is_active: bool
    branch_id: Optional[int]
    
    class Config:
        from_attributes = True

# === AUTHENTICATION SCHEMAS ===

class LoginRequest(BaseModel):
    username: str
    password: str
    device_id: Optional[str] = None
    remember_me: bool = False

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds

class TokenData(BaseModel):
    """Datos incluidos en el token JWT"""
    user_id: int
    username: str
    role: UserRole
    permissions: List[str]
    branch_id: Optional[int] = None
    is_superuser: bool = False
    exp: int  # expiration timestamp
    iat: int  # issued at timestamp
    jti: str  # JWT ID (unique identifier)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
    logout_all_devices: bool = False

# === PERMISSION SCHEMAS ===

class PermissionCheck(BaseModel):
    permission: str
    resource_id: Optional[int] = None
    branch_id: Optional[int] = None

class PermissionResponse(BaseModel):
    has_permission: bool
    reason: Optional[str] = None

class RolePermissions(BaseModel):
    role: UserRole
    permissions: List[str]
    description: str

# === SESSION SCHEMAS ===

class UserSessionResponse(BaseModel):
    id: int
    device_id: Optional[str]
    user_agent: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_current: bool = False
    
    class Config:
        from_attributes = True

class SessionListResponse(BaseModel):
    sessions: List[UserSessionResponse]
    total: int

# === UTILITY SCHEMAS ===

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        return v

class UserStats(BaseModel):
    """Estadísticas del usuario"""
    total_users: int
    active_users: int
    users_by_role: Dict[str, int]
    recent_logins: int

# === API RESPONSE SCHEMAS ===

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
