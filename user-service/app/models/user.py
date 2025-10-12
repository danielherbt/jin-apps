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

class Permission(PyEnum):
    """Permisos granulares del sistema"""
    # User Management
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    
    # Sales Management
    CREATE_SALE = "create_sale"
    READ_SALE = "read_sale"
    UPDATE_SALE = "update_sale"
    DELETE_SALE = "delete_sale"
    
    # Inventory Management
    CREATE_PRODUCT = "create_product"
    READ_PRODUCT = "read_product"
    UPDATE_PRODUCT = "update_product"
    DELETE_PRODUCT = "delete_product"
    
    # Invoice Management
    CREATE_INVOICE = "create_invoice"
    READ_INVOICE = "read_invoice"
    UPDATE_INVOICE = "update_invoice"
    DELETE_INVOICE = "delete_invoice"
    
    # Branch Management
    CREATE_BRANCH = "create_branch"
    READ_BRANCH = "read_branch"
    UPDATE_BRANCH = "update_branch"
    DELETE_BRANCH = "delete_branch"
    
    # Reports
    VIEW_REPORTS = "view_reports"
    EXPORT_REPORTS = "export_reports"
    
    # System
    SYSTEM_CONFIG = "system_config"
    VIEW_LOGS = "view_logs"

class User(Base):
    """Modelo de usuario con roles y permisos JWT"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Role y estado
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.VIEWER)
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
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"
    
    @property
    def permissions(self) -> List[Permission]:
        """Obtiene permisos basados en el rol del usuario"""
        return get_permissions_for_role(self.role)
    
    def has_permission(self, permission: Permission) -> bool:
        """Verifica si el usuario tiene un permiso específico"""
        if self.is_superuser:
            return True
        return permission in self.permissions
    
    def can_access_branch(self, branch_id: int) -> bool:
        """Verifica si el usuario puede acceder a una sucursal específica"""
        if self.is_superuser or self.role == UserRole.ADMIN:
            return True
        if self.branch_id is None:  # Acceso a todas las sucursales
            return True
        return self.branch_id == branch_id

class UserSession(Base):
    """Modelo para gestionar sesiones activas JWT"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    refresh_token = Column(String(255), unique=True, index=True, nullable=False)
    
    # Device/Client info
    device_id = Column(String(255), nullable=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    
    # Session management
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    is_revoked = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User")

def get_permissions_for_role(role: UserRole) -> List[Permission]:
    """Mapeo de roles a permisos"""
    role_permissions = {
        UserRole.ADMIN: [
            # Full access to everything
            Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
            Permission.CREATE_SALE, Permission.READ_SALE, Permission.UPDATE_SALE, Permission.DELETE_SALE,
            Permission.CREATE_PRODUCT, Permission.READ_PRODUCT, Permission.UPDATE_PRODUCT, Permission.DELETE_PRODUCT,
            Permission.CREATE_INVOICE, Permission.READ_INVOICE, Permission.UPDATE_INVOICE, Permission.DELETE_INVOICE,
            Permission.CREATE_BRANCH, Permission.READ_BRANCH, Permission.UPDATE_BRANCH, Permission.DELETE_BRANCH,
            Permission.VIEW_REPORTS, Permission.EXPORT_REPORTS,
            Permission.SYSTEM_CONFIG, Permission.VIEW_LOGS
        ],
        
        UserRole.MANAGER: [
            # Management level access
            Permission.READ_USER, Permission.UPDATE_USER,
            Permission.CREATE_SALE, Permission.READ_SALE, Permission.UPDATE_SALE,
            Permission.CREATE_PRODUCT, Permission.READ_PRODUCT, Permission.UPDATE_PRODUCT,
            Permission.CREATE_INVOICE, Permission.READ_INVOICE, Permission.UPDATE_INVOICE,
            Permission.READ_BRANCH, Permission.UPDATE_BRANCH,
            Permission.VIEW_REPORTS, Permission.EXPORT_REPORTS
        ],
        
        UserRole.CASHIER: [
            # Cashier operations
            Permission.CREATE_SALE, Permission.READ_SALE,
            Permission.READ_PRODUCT,
            Permission.CREATE_INVOICE, Permission.READ_INVOICE,
            Permission.READ_BRANCH
        ],
        
        UserRole.VIEWER: [
            # Read-only access
            Permission.READ_SALE,
            Permission.READ_PRODUCT,
            Permission.READ_INVOICE,
            Permission.READ_BRANCH
        ]
    }
    
    return role_permissions.get(role, [])
