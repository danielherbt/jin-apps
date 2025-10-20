from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_user_token, refresh_access_token, check_user_permission,
    create_default_admin_user
)
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, UserRole, Permission, get_permissions_for_role
from app.schemas.user import (
    UserCreate, UserResponse, UserUpdate, LoginRequest, Token,
    RefreshTokenRequest, TokenData, PermissionCheck, PermissionResponse,
    RolePermissions, UserProfile, APIResponse
)

router = APIRouter()

# === AUTHENTICATION ENDPOINTS ===

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Autenticación completa con JWT y roles"""
    
    # Buscar usuario
    user = db.query(User).filter(
        User.username == login_data.username,
        User.is_active == True
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Actualizar último login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Crear tokens JWT
    token_data = create_access_token(user)
    
    return Token(
        access_token=token_data["access_token"],
        refresh_token=token_data["refresh_token"],
        token_type=token_data["token_type"],
        expires_in=token_data["expires_in"]
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Renovar access token usando refresh token"""
    
    token_data = refresh_access_token(refresh_data.refresh_token, db)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return Token(
        access_token=token_data["access_token"],
        refresh_token="",  # No incluir refresh token en renovación
        token_type=token_data["token_type"],
        expires_in=token_data["expires_in"]
    )

@router.get("/me", response_model=UserProfile)
async def get_current_user(
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Obtener información del usuario actual"""
    
    user = db.query(User).filter(User.id == current_user.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Crear UserProfile compatible con RBAC manualmente
    return UserProfile(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role.name if user.role else "no_role",
        role_display_name=user.role.display_name if user.role else None,
        is_active=user.is_active,
        branch_id=user.branch_id
    )

@router.post("/check-permission", response_model=PermissionResponse)
async def check_permission(
    permission_check: PermissionCheck,
    current_user: TokenData = Depends(get_current_user_token)
):
    """Verificar si el usuario actual tiene un permiso específico"""
    
    try:
        permission = Permission(permission_check.permission)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission: {permission_check.permission}"
        )
    
    result = check_user_permission(
        current_user, 
        permission,
        resource_id=permission_check.resource_id,
        branch_id=permission_check.branch_id
    )
    
    return PermissionResponse(
        has_permission=result["has_permission"],
        reason=result.get("reason")
    )

@router.get("/permissions", response_model=List[str])
async def get_user_permissions(
    current_user: TokenData = Depends(get_current_user_token)
):
    """Obtener lista de permisos del usuario actual"""
    return current_user.permissions

@router.get("/roles", response_model=List[RolePermissions])
async def get_available_roles():
    """Obtener lista de roles disponibles y sus permisos"""
    
    roles_info = []
    
    role_descriptions = {
        UserRole.ADMIN: "Administrador del sistema con acceso completo",
        UserRole.MANAGER: "Gerente con permisos de gestión",
        UserRole.CASHIER: "Cajero con permisos de venta",
        UserRole.VIEWER: "Consultor con acceso de solo lectura"
    }
    
    for role in UserRole:
        permissions = [perm.value for perm in get_permissions_for_role(role)]
        roles_info.append(RolePermissions(
            role=role,
            permissions=permissions,
            description=role_descriptions.get(role, "")
        ))
    
    return roles_info

# === USER MANAGEMENT ENDPOINTS ===

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Registrar nuevo usuario (requiere permisos de admin)"""
    
    # Verificar permisos
    permission_check = check_user_permission(current_user, Permission.CREATE_USER)
    if not permission_check["has_permission"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=permission_check.get("reason", "Permission required: CREATE_USER")
        )
    
    # Verificar que el usuario no existe
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Crear usuario
    hashed_password = get_password_hash(user_data.password)
    
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role,
        is_active=user_data.is_active,
        branch_id=user_data.branch_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.from_orm(db_user)

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Listar usuarios (requiere permisos de lectura)"""
    
    # Verificar permisos
    permission_check = check_user_permission(current_user, Permission.READ_USER)
    if not permission_check["has_permission"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=permission_check.get("reason", "Permission required: READ_USER")
        )
    
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.from_orm(user) for user in users]

@router.post("/setup-admin", response_model=APIResponse)
async def setup_default_admin(db: Session = Depends(get_db)):
    """Crear usuario administrador por defecto (solo si no existe ningún admin)"""
    
    # Verificar si ya existe un admin
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user already exists"
        )
    
    # Crear admin por defecto
    admin_data = create_default_admin_user()
    hashed_password = get_password_hash(admin_data["password"])
    
    admin_user = User(
        username=admin_data["username"],
        email=admin_data["email"],
        full_name=admin_data["full_name"],
        hashed_password=hashed_password,
        role=admin_data["role"],
        is_superuser=admin_data["is_superuser"],
        is_active=admin_data["is_active"]
    )
    
    db.add(admin_user)
    db.commit()
    
    return APIResponse(
        success=True,
        message=f"Default admin user created. Username: {admin_data['username']}, Password: {admin_data['password']}",
        data={
            "username": admin_data["username"],
            "temporary_password": admin_data["password"]
        }
    )

# === SIMPLIFIED ENDPOINTS FOR TESTING ===

@router.post("/simple-login")
async def simple_login(credentials: Dict[str, Any]):
    """Login simplificado para testing (mantiene compatibilidad)"""
    username = credentials.get("username")
    password = credentials.get("password")
    
    # Usuarios de prueba para el dashboard web
    test_users = {
        "admin": {"password": "admin", "role": "admin", "permissions": ["all"]},
        "manager": {"password": "manager", "role": "manager", "permissions": ["read", "write"]},
        "cashier": {"password": "cashier", "role": "cashier", "permissions": ["read", "sale"]},
        "viewer": {"password": "viewer", "role": "viewer", "permissions": ["read"]}
    }
    
    if username in test_users and password == test_users[username]["password"]:
        return {
            "access_token": f"test-token-{username}",
            "token_type": "bearer",
            "user": {
                "username": username,
                "role": test_users[username]["role"],
                "permissions": test_users[username]["permissions"]
            }
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/test-auth")
async def test_auth(current_user: TokenData = Depends(get_current_user_token)):
    """Endpoint para probar autenticación JWT"""
    return {
        "message": "Authentication successful!",
        "user": {
            "id": current_user.user_id,
            "username": current_user.username,
            "role": current_user.role.value,
            "permissions": current_user.permissions,
            "is_superuser": current_user.is_superuser,
            "branch_id": current_user.branch_id
        }
    }

# === HEALTH AND STATUS ENDPOINTS ===

@router.get("/health")
async def auth_health():
    """Health check del servicio de autenticación"""
    return {
        "status": "healthy",
        "service": "auth",
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "jwt_auth": True,
            "role_based_access": True,
            "permission_system": True,
            "refresh_tokens": True,
            "multi_branch_support": True
        }
    }

@router.get("/system-info")
async def get_system_info():
    """Información del sistema de autenticación"""
    return {
        "available_roles": [role.value for role in UserRole],
        "available_permissions": [perm.value for perm in Permission],
        "token_settings": {
            "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "algorithm": settings.ALGORITHM
        },
        "role_hierarchy": {
            "ADMIN": 4,
            "MANAGER": 3, 
            "CASHIER": 2,
            "VIEWER": 1
        }
    }
