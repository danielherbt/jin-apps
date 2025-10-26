from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings
from ..models.user import User, UserRole
from ..schemas.user import TokenData
from ..models.rbac import Permission
import secrets
import uuid
from functools import wraps

# === PASSWORD MANAGEMENT ===

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash de password"""
    return pwd_context.hash(password)

def generate_password() -> str:
    """Generar password aleatorio"""
    return secrets.token_urlsafe(12)

# === JWT TOKEN MANAGEMENT ===

def create_access_token(
    user: User, 
    expires_delta: Optional[timedelta] = None,
    include_refresh: bool = True
) -> Dict[str, Any]:
    """Crear tokens JWT con información completa del usuario"""
    
    # Configurar expiración
    if expires_delta:
        access_expire = datetime.utcnow() + expires_delta
    else:
        access_expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    refresh_expire = datetime.utcnow() + timedelta(days=7)  # Refresh token 7 días
    
    # JWT ID único
    jti = str(uuid.uuid4())
    
    # Payload del access token
    access_payload = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.name if user.role else "no_role",
        "permissions": user.permissions if isinstance(user.permissions, list) else [perm.value for perm in user.permissions],
        "branch_id": user.branch_id,
        "is_superuser": user.is_superuser,
        "is_active": user.is_active,
        "iat": datetime.utcnow().timestamp(),
        "exp": access_expire.timestamp(),
        "jti": jti,
        "type": "access"
    }
    
    # Crear access token
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    result = {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": int((access_expire - datetime.utcnow()).total_seconds())
    }
    
    # Crear refresh token si se requiere
    if include_refresh:
        refresh_payload = {
            "sub": str(user.id),
            "username": user.username,
            "iat": datetime.utcnow().timestamp(),
            "exp": refresh_expire.timestamp(),
            "jti": f"refresh_{jti}",
            "type": "refresh"
        }
        
        refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        result["refresh_token"] = refresh_token
    
    return result

def verify_token(token: str) -> Optional[TokenData]:
    """Verificar y decodificar token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Validar campos requeridos
        user_id = payload.get("sub")
        username = payload.get("username")
        
        if not user_id or not username:
            return None
        
        # Crear TokenData con compatibilidad RBAC
        role_name = payload.get("role", "viewer")
        
        # Mapear string de rol a enum para compatibilidad
        role_mapping = {
            "admin": UserRole.ADMIN,
            "manager": UserRole.MANAGER,
            "cashier": UserRole.CASHIER,
            "viewer": UserRole.VIEWER
        }
        role_enum = role_mapping.get(role_name, UserRole.VIEWER)
        
        token_data = TokenData(
            user_id=int(user_id),
            username=username,
            role=role_enum,
            permissions=payload.get("permissions", []),
            branch_id=payload.get("branch_id"),
            is_superuser=payload.get("is_superuser", False),
            exp=int(payload.get("exp", 0)),
            iat=int(payload.get("iat", 0)),
            jti=payload.get("jti", "")
        )
        
        return token_data
        
    except (JWTError, ValueError, KeyError):
        return None

def refresh_access_token(refresh_token: str, db: Session) -> Optional[Dict[str, Any]]:
    """Renovar access token usando refresh token"""
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verificar que es un refresh token
        if payload.get("type") != "refresh":
            return None
        
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        
        if not user:
            return None
        
        # Crear nuevo access token
        return create_access_token(user, include_refresh=False)
        
    except (JWTError, ValueError, KeyError):
        return None

# === AUTHENTICATION DEPENDENCIES ===

async def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Dependency para obtener usuario actual del token JWT"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token_data = verify_token(credentials.credentials)
        if not token_data:
            raise credentials_exception
        
        # Verificar expiración
        if datetime.utcnow().timestamp() > token_data.exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return token_data
        
    except Exception:
        raise credentials_exception

# === PERMISSION HELPERS ===

def check_user_permission(
    user_data: TokenData,
    permission: Permission,
    resource_id: Optional[int] = None,
    branch_id: Optional[int] = None
) -> Dict[str, Any]:
    """Verificar permisos de usuario con contexto"""
    
    if user_data.is_superuser:
        return {"has_permission": True}
    
    # Verificar permiso básico
    if permission.value not in user_data.permissions:
        return {
            "has_permission": False,
            "reason": f"User does not have permission: {permission.value}"
        }
    
    # Verificar acceso a sucursal si se especifica
    if branch_id and user_data.branch_id and user_data.branch_id != branch_id:
        return {
            "has_permission": False,
            "reason": f"User cannot access branch: {branch_id}"
        }
    
    return {"has_permission": True}

def get_role_hierarchy() -> Dict[UserRole, int]:
    """Obtener jerarquía de roles (mayor número = mayor privilegio)"""
    return {
        UserRole.VIEWER: 1,
        UserRole.CASHIER: 2,
        UserRole.MANAGER: 3,
        UserRole.ADMIN: 4
    }

def user_has_higher_role(user_role: UserRole, target_role: UserRole) -> bool:
    """Verificar si un usuario tiene un rol superior a otro"""
    hierarchy = get_role_hierarchy()
    return hierarchy.get(user_role, 0) > hierarchy.get(target_role, 0)

# === PERMISSION DECORATORS FOR ENDPOINTS ===

def require_permission(permission: Permission):
    """Decorator para endpoints que requieren permisos específicos"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: TokenData = Depends(get_current_user_token), **kwargs):
            
            permission_check = check_user_permission(current_user, permission)
            
            if not permission_check["has_permission"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=permission_check.get("reason", f"Permission required: {permission.value}")
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

def require_role(required_role: UserRole):
    """Decorator para endpoints que requieren roles específicos"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: TokenData = Depends(get_current_user_token), **kwargs):
            
            if current_user.role != required_role and not current_user.is_superuser:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role required: {required_role.value}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# === UTILITY FUNCTIONS ===

def create_default_admin_user() -> Dict[str, Any]:
    """Crear datos para usuario administrador por defecto"""
    return {
        "username": "admin",
        "email": "admin@possystem.com",
        "full_name": "System Administrator",
        "password": generate_password(),  # Se debe cambiar al primer login
        "role": UserRole.ADMIN,
        "is_superuser": True,
        "is_active": True
    }