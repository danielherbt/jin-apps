"""
RBAC Management Endpoints
Endpoints para gestionar roles, permisos y asignaciones
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ....core.security import get_current_user_token
from ....db.session import get_db
from ....models.rbac import Role, Permission, UserPermission, get_user_effective_permissions
from ....models.user import User
from ....schemas.user import TokenData, APIResponse
from pydantic import BaseModel

router = APIRouter()

# === PYDANTIC SCHEMAS ===

class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    is_active: bool
    permission_count: int
    
    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    resource: str
    action: str
    is_active: bool
    
    class Config:
        from_attributes = True

class UserPermissionGrant(BaseModel):
    user_id: int
    permission_name: str
    granted: bool = True
    expires_at: Optional[datetime] = None

class UserPermissionResponse(BaseModel):
    id: int
    user_id: int
    username: str
    permission_name: str
    permission_display_name: str
    granted: bool
    granted_at: datetime
    expires_at: Optional[datetime]
    is_valid: bool
    
class EffectivePermissionsResponse(BaseModel):
    user_id: int
    username: str
    role_name: str
    role_permissions: List[str]
    user_specific_permissions: List[Dict[str, Any]]
    effective_permissions: List[str]

# === ROLE MANAGEMENT ENDPOINTS ===

@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Listar todos los roles disponibles"""
    
    # Verificar permisos - solo admin puede ver roles
    if not current_user.is_superuser and "system_config" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view roles"
        )
    
    roles = db.query(Role).filter(Role.is_active == True).all()
    
    role_responses = []
    for role in roles:
        role_responses.append(RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_active=role.is_active,
            permission_count=len(role.permissions)
        ))
    
    return role_responses

@router.get("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
async def get_role_permissions(
    role_id: int,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Obtener permisos de un rol específico"""
    
    # Verificar permisos
    if not current_user.is_superuser and "read_user" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    permissions = []
    for perm in role.permissions:
        permissions.append(PermissionResponse(
            id=perm.id,
            name=perm.name,
            display_name=perm.display_name,
            description=perm.description,
            resource=perm.resource,
            action=perm.action,
            is_active=perm.is_active
        ))
    
    return permissions

# === PERMISSION MANAGEMENT ENDPOINTS ===

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    resource: Optional[str] = None,
    action: Optional[str] = None,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Listar permisos disponibles con filtros opcionales"""
    
    # Verificar permisos
    if not current_user.is_superuser and "system_config" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view permissions"
        )
    
    query = db.query(Permission).filter(Permission.is_active == True)
    
    if resource:
        query = query.filter(Permission.resource == resource)
    if action:
        query = query.filter(Permission.action == action)
    
    permissions = query.all()
    
    return [PermissionResponse(
        id=perm.id,
        name=perm.name,
        display_name=perm.display_name,
        description=perm.description,
        resource=perm.resource,
        action=perm.action,
        is_active=perm.is_active
    ) for perm in permissions]

@router.get("/permissions/resources")
async def get_permission_resources(
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Obtener lista de recursos disponibles para permisos"""
    
    if not current_user.is_superuser and "system_config" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    resources = db.query(Permission.resource).distinct().all()
    return {"resources": [r[0] for r in resources]}

# === USER PERMISSION MANAGEMENT ===

@router.post("/users/{user_id}/permissions", response_model=APIResponse)
async def grant_user_permission(
    user_id: int,
    permission_grant: UserPermissionGrant,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Otorgar o denegar un permiso específico a un usuario"""
    
    # Verificar permisos - solo admin o manager pueden otorgar permisos
    if not current_user.is_superuser and "create_user" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to grant user permissions"
        )
    
    # Verificar que el usuario existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verificar que el permiso existe
    permission = db.query(Permission).filter(Permission.name == permission_grant.permission_name).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    # Verificar si ya existe el permiso específico para el usuario
    existing = db.query(UserPermission).filter(
        UserPermission.user_id == user_id,
        UserPermission.permission_id == permission.id
    ).first()
    
    if existing:
        # Actualizar permiso existente
        existing.granted = permission_grant.granted
        existing.expires_at = permission_grant.expires_at
        existing.granted_by = current_user.user_id
        existing.granted_at = datetime.utcnow()
    else:
        # Crear nuevo permiso específico
        user_permission = UserPermission(
            user_id=user_id,
            permission_id=permission.id,
            granted=permission_grant.granted,
            expires_at=permission_grant.expires_at,
            granted_by=current_user.user_id
        )
        db.add(user_permission)
    
    db.commit()
    
    action = "granted" if permission_grant.granted else "denied"
    return APIResponse(
        success=True,
        message=f"Permission '{permission_grant.permission_name}' {action} to user '{user.username}'",
        data={
            "user_id": user_id,
            "permission": permission_grant.permission_name,
            "granted": permission_grant.granted,
            "expires_at": permission_grant.expires_at.isoformat() if permission_grant.expires_at else None
        }
    )

@router.get("/users/{user_id}/permissions", response_model=List[UserPermissionResponse])
async def get_user_specific_permissions(
    user_id: int,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
): 
    """Obtener permisos específicos otorgados a un usuario"""
    
    # Los usuarios pueden ver sus propios permisos, admin puede ver todos
    if not current_user.is_superuser and current_user.user_id != user_id and "read_user" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).join(Permission).all()
    
    responses = []
    for user_perm in user_permissions:
        responses.append(UserPermissionResponse(
            id=user_perm.id,
            user_id=user_perm.user_id,
            username=user.username,
            permission_name=user_perm.permission.name,
            permission_display_name=user_perm.permission.display_name,
            granted=user_perm.granted,
            granted_at=user_perm.granted_at,
            expires_at=user_perm.expires_at,
            is_valid=user_perm.is_valid()
        ))
    
    return responses

@router.get("/users/{user_id}/effective-permissions", response_model=EffectivePermissionsResponse)
async def get_user_effective_permissions_endpoint(
    user_id: int,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Obtener permisos efectivos de un usuario (rol + permisos específicos)"""
    
    # Los usuarios pueden ver sus propios permisos, admin puede ver todos
    if not current_user.is_superuser and current_user.user_id != user_id and "read_user" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Obtener permisos del rol
    role_permissions = []
    if user.role:
        role_permissions = user.role.get_permission_names()
    
    # Obtener permisos específicos del usuario
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).join(Permission).all()
    
    user_specific_perms = []
    for user_perm in user_permissions:
        if user_perm.is_valid():
            user_specific_perms.append({
                "permission": user_perm.permission.name,
                "granted": user_perm.granted,
                "expires_at": user_perm.expires_at.isoformat() if user_perm.expires_at else None
            })
    
    # Calcular permisos efectivos
    effective_permissions = get_user_effective_permissions(user_id, db)
    
    return EffectivePermissionsResponse(
        user_id=user_id,
        username=user.username,
        role_name=user.role.name if user.role else "no_role",
        role_permissions=role_permissions,
        user_specific_permissions=user_specific_perms,
        effective_permissions=effective_permissions
    )

@router.delete("/users/{user_id}/permissions/{permission_name}", response_model=APIResponse)
async def revoke_user_permission(
    user_id: int,
    permission_name: str,
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Revocar un permiso específico de un usuario"""
    
    # Verificar permisos - solo admin puede revocar permisos
    if not current_user.is_superuser and "delete_user" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to revoke user permissions"
        )
    
    # Buscar el permiso específico del usuario
    user_permission = db.query(UserPermission).join(Permission).filter(
        UserPermission.user_id == user_id,
        Permission.name == permission_name
    ).first()
    
    if not user_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User permission not found"
        )
    
    db.delete(user_permission)
    db.commit()
    
    return APIResponse(
        success=True,
        message=f"User permission '{permission_name}' revoked successfully",
        data={"user_id": user_id, "permission": permission_name}
    )

# === SYSTEM STATUS ENDPOINTS ===

@router.get("/system/status")
async def get_rbac_system_status(
    current_user: TokenData = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Obtener estado del sistema RBAC"""
    
    if not current_user.is_superuser and "system_config" not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    total_roles = db.query(Role).count()
    active_roles = db.query(Role).filter(Role.is_active == True).count()
    total_permissions = db.query(Permission).count()
    active_permissions = db.query(Permission).filter(Permission.is_active == True).count()
    total_users = db.query(User).count()
    users_with_roles = db.query(User).filter(User.role_id.isnot(None)).count()
    specific_permissions = db.query(UserPermission).count()
    
    return {
        "rbac_system": "active",
        "roles": {
            "total": total_roles,
            "active": active_roles
        },
        "permissions": {
            "total": total_permissions,
            "active": active_permissions
        },
        "users": {
            "total": total_users,
            "with_roles": users_with_roles,
            "specific_permissions": specific_permissions
        },
        "health": "healthy" if users_with_roles == total_users else "needs_attention"
    }