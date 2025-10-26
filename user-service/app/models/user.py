from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from typing import List, Optional
from ..db.session import Base
import uuid

class UserRole(PyEnum):
    """Roles de usuario disponibles en el sistema"""
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"
    VIEWER = "viewer"


class User(Base):
    """Modelo de usuario con roles y permisos RBAC escalable"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Role relationship (Foreign Key to roles table)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Branch assignment (for multi-branch support)
    branch_id = Column(Integer, nullable=True)  # None = all branches
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Token management
    refresh_token = Column(String(255), nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    user_permissions = relationship("UserPermission", foreign_keys="UserPermission.user_id", back_populates="user")
    
    def __repr__(self):
        role_name = self.role.name if self.role else "no_role"
        return f"<User(username='{self.username}', role='{role_name}')>"
    
    @property
    def permissions(self) -> List[str]:
        """Obtiene permisos efectivos del usuario (rol + permisos específicos)"""
        from .rbac import get_user_effective_permissions
        from ..db.session import get_db
        
        # This is a simplified version for compatibility
        # In real usage, pass the db session as parameter
        try:
            db = next(get_db())
            return get_user_effective_permissions(self.id, db)
        except:
            # Fallback to role permissions only
            if self.role:
                return self.role.get_permission_names()
            return []
    
    def has_permission(self, permission_name: str) -> bool:
        """Verifica si el usuario tiene un permiso específico"""
        if self.is_superuser:
            return True
        return permission_name in self.permissions
    
    def can_access_branch(self, branch_id: int) -> bool:
        """Verifica si el usuario puede acceder a una sucursal específica"""
        if self.is_superuser:
            return True
        if self.role and self.role.name == "admin":
            return True
        if self.branch_id is None:  # Acceso a todas las sucursales
            return True
        return self.branch_id == branch_id
    
    # Compatibility property for legacy code
    @property
    def role_enum(self) -> Optional[UserRole]:
        """Compatibilidad con el enum legacy"""
        if not self.role:
            return UserRole.VIEWER
        
        role_mapping = {
            "admin": UserRole.ADMIN,
            "manager": UserRole.MANAGER,
            "cashier": UserRole.CASHIER,
            "viewer": UserRole.VIEWER
        }
        return role_mapping.get(self.role.name, UserRole.VIEWER)


