"""
Role-Based Access Control (RBAC) Models
Implementación escalable de roles y permisos
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func
from typing import List, Optional
from ..db.session import Base

# Tabla de asociación para role_permissions (many-to-many)
role_permissions_table = Table(
    'role_permissions',
    Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete="CASCADE"), nullable=False),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete="CASCADE"), nullable=False),
    Column('granted_at', DateTime(timezone=True), server_default=func.now())
)

class Role(Base):
    """Modelo de roles del sistema"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)  # admin, manager, cashier
    display_name = Column(String(100), nullable=False)  # "System Administrator"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    permissions = relationship("Permission", secondary=role_permissions_table, back_populates="roles")
    users = relationship("User", back_populates="role")
    
    def __repr__(self):
        return f"<Role(name='{self.name}', display_name='{self.display_name}')>"
    
    def has_permission(self, permission_name: str) -> bool:
        """Verificar si el rol tiene un permiso específico"""
        return any(p.name == permission_name for p in self.permissions if p.is_active)
    
    def get_permission_names(self) -> List[str]:
        """Obtener lista de nombres de permisos del rol"""
        return [p.name for p in self.permissions if p.is_active]

class Permission(Base):
    """Modelo de permisos granulares"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # create_user, read_sales
    display_name = Column(String(100), nullable=False)  # "Create Users"
    description = Column(Text, nullable=True)
    
    # Categorización del permiso
    resource = Column(String(50), nullable=False, index=True)  # users, sales, products, reports
    action = Column(String(50), nullable=False, index=True)    # create, read, update, delete, export
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    roles = relationship("Role", secondary=role_permissions_table, back_populates="permissions")
    user_permissions = relationship("UserPermission", back_populates="permission")
    
    def __repr__(self):
        return f"<Permission(name='{self.name}', resource='{self.resource}', action='{self.action}')>"

class UserPermission(Base):
    """Permisos específicos por usuario (sobrescribir permisos de rol)"""
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey('permissions.id', ondelete="CASCADE"), nullable=False)
    
    # Grant/Deny specific permission
    granted = Column(Boolean, default=True)  # True = granted, False = explicitly denied
    
    # Metadata
    granted_by = Column(Integer, ForeignKey('users.id'), nullable=True)  # Who granted this permission
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="user_permissions")
    permission = relationship("Permission", back_populates="user_permissions")
    granted_by_user = relationship("User", foreign_keys=[granted_by])
    
    def __repr__(self):
        action = "granted" if self.granted else "denied"
        return f"<UserPermission(user_id={self.user_id}, permission='{self.permission.name}', {action})>"
    
    def is_valid(self) -> bool:
        """Verificar si el permiso está vigente"""
        if self.expires_at:
            from datetime import datetime
            return datetime.utcnow() <= self.expires_at.replace(tzinfo=None)
        return True

# Funciones de utilidad para el sistema RBAC
def create_default_roles_and_permissions():
    """Crear roles y permisos por defecto del sistema"""
    from ..db.session import get_db
    
    db = next(get_db())
    
    try:
        # Crear permisos básicos
        permissions_data = [
            # User Management
            {"name": "create_user", "display_name": "Create Users", "resource": "users", "action": "create"},
            {"name": "read_user", "display_name": "View Users", "resource": "users", "action": "read"},
            {"name": "update_user", "display_name": "Update Users", "resource": "users", "action": "update"},
            {"name": "delete_user", "display_name": "Delete Users", "resource": "users", "action": "delete"},
            
            # Sales Management
            {"name": "create_sale", "display_name": "Create Sales", "resource": "sales", "action": "create"},
            {"name": "read_sale", "display_name": "View Sales", "resource": "sales", "action": "read"},
            {"name": "update_sale", "display_name": "Update Sales", "resource": "sales", "action": "update"},
            {"name": "delete_sale", "display_name": "Delete Sales", "resource": "sales", "action": "delete"},
            
            # Product Management
            {"name": "create_product", "display_name": "Create Products", "resource": "products", "action": "create"},
            {"name": "read_product", "display_name": "View Products", "resource": "products", "action": "read"},
            {"name": "update_product", "display_name": "Update Products", "resource": "products", "action": "update"},
            {"name": "delete_product", "display_name": "Delete Products", "resource": "products", "action": "delete"},
            
            # Invoice Management
            {"name": "create_invoice", "display_name": "Create Invoices", "resource": "invoices", "action": "create"},
            {"name": "read_invoice", "display_name": "View Invoices", "resource": "invoices", "action": "read"},
            {"name": "update_invoice", "display_name": "Update Invoices", "resource": "invoices", "action": "update"},
            {"name": "delete_invoice", "display_name": "Delete Invoices", "resource": "invoices", "action": "delete"},
            
            # Branch Management
            {"name": "create_branch", "display_name": "Create Branches", "resource": "branches", "action": "create"},
            {"name": "read_branch", "display_name": "View Branches", "resource": "branches", "action": "read"},
            {"name": "update_branch", "display_name": "Update Branches", "resource": "branches", "action": "update"},
            {"name": "delete_branch", "display_name": "Delete Branches", "resource": "branches", "action": "delete"},
            
            # Reports
            {"name": "view_reports", "display_name": "View Reports", "resource": "reports", "action": "read"},
            {"name": "export_reports", "display_name": "Export Reports", "resource": "reports", "action": "export"},
            
            # System
            {"name": "system_config", "display_name": "System Configuration", "resource": "system", "action": "configure"},
            {"name": "view_logs", "display_name": "View System Logs", "resource": "system", "action": "read"},
        ]
        
        permissions = {}
        for perm_data in permissions_data:
            permission = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
            if not permission:
                permission = Permission(**perm_data)
                db.add(permission)
            permissions[perm_data["name"]] = permission
        
        # Crear roles por defecto
        roles_data = [
            {
                "name": "admin",
                "display_name": "System Administrator", 
                "description": "Full system access",
                "permissions": list(permissions.keys())  # All permissions
            },
            {
                "name": "manager",
                "display_name": "Manager",
                "description": "Management level access",
                "permissions": [
                    "read_user", "update_user", "create_sale", "read_sale", "update_sale",
                    "create_product", "read_product", "update_product", "create_invoice",
                    "read_invoice", "update_invoice", "read_branch", "update_branch",
                    "view_reports", "export_reports"
                ]
            },
            {
                "name": "cashier", 
                "display_name": "Cashier",
                "description": "Point of sale operations",
                "permissions": [
                    "create_sale", "read_sale", "read_product", "create_invoice", 
                    "read_invoice", "read_branch"
                ]
            },
            {
                "name": "viewer",
                "display_name": "Viewer",
                "description": "Read-only access",
                "permissions": [
                    "read_sale", "read_product", "read_invoice", "read_branch"
                ]
            }
        ]
        
        for role_data in roles_data:
            role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not role:
                role = Role(
                    name=role_data["name"],
                    display_name=role_data["display_name"],
                    description=role_data["description"]
                )
                db.add(role)
            
            # Asignar permisos al rol
            role.permissions.clear()
            for perm_name in role_data["permissions"]:
                if perm_name in permissions:
                    role.permissions.append(permissions[perm_name])
        
        db.commit()
        return True
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_user_effective_permissions(user_id: int, db: Session) -> List[str]:
    """Obtener permisos efectivos de un usuario (rol + permisos específicos)"""
    from .user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    # Obtener permisos del rol
    role_permissions = set()
    if user.role:
        role_permissions = set(user.role.get_permission_names())
    
    # Obtener permisos específicos del usuario
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).all()
    
    # Aplicar permisos específicos (grant/deny)
    effective_permissions = role_permissions.copy()
    
    for user_perm in user_permissions:
        if user_perm.is_valid():
            if user_perm.granted:
                effective_permissions.add(user_perm.permission.name)
            else:
                effective_permissions.discard(user_perm.permission.name)
    
    return list(effective_permissions)