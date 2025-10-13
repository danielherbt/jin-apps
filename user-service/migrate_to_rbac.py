#!/usr/bin/env python3
"""
Migration script to implement RBAC (Role-Based Access Control)
Migrates from enum-based roles to database-based RBAC system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.rbac import create_default_roles_and_permissions, Role, Permission as RBACPermission, UserPermission
from app.models.user import User, UserRole
from app.db.session import get_db
from sqlalchemy.orm import Session

def create_rbac_tables():
    """Create RBAC tables using raw SQL"""
    
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL for creating RBAC tables
    sql_commands = [
        # Create roles table
        """
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
        """,
        
        # Create permissions table
        """
        CREATE TABLE IF NOT EXISTS permissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            resource VARCHAR(50) NOT NULL,
            action VARCHAR(50) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # Create role_permissions junction table
        """
        CREATE TABLE IF NOT EXISTS role_permissions (
            id SERIAL PRIMARY KEY,
            role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(role_id, permission_id)
        );
        """,
        
        # Create user_permissions table
        """
        CREATE TABLE IF NOT EXISTS user_permissions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            granted BOOLEAN DEFAULT TRUE,
            granted_by INTEGER REFERENCES users(id),
            granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(user_id, permission_id)
        );
        """,
        
        # Add role_id column to users table
        """
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);
        """,
        
        # Create indexes for performance
        """
        CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
        CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
        CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
        CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
        """
    ]
    
    with engine.connect() as conn:
        for sql in sql_commands:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"✅ Executed SQL successfully")
            except Exception as e:
                print(f"⚠️  SQL execution warning: {e}")

def populate_rbac_data():
    """Populate RBAC tables with default data and migrate existing users"""
    
    print("📝 Populating RBAC data...")
    
    db = next(get_db())
    
    try:
        # Create default roles and permissions
        print("Creating default roles and permissions...")
        create_default_roles_and_permissions()
        
        # Get roles for mapping
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        manager_role = db.query(Role).filter(Role.name == "manager").first()
        cashier_role = db.query(Role).filter(Role.name == "cashier").first()
        viewer_role = db.query(Role).filter(Role.name == "viewer").first()
        
        role_mapping = {
            "ADMIN": admin_role.id if admin_role else None,
            "MANAGER": manager_role.id if manager_role else None,
            "CASHIER": cashier_role.id if cashier_role else None,
            "VIEWER": viewer_role.id if viewer_role else None
        }
        
        # Migrate existing users
        print("Migrating existing users...")
        users = db.query(User).all()
        
        for user in users:
            if hasattr(user, 'role') and user.role:
                # Get role enum value
                if hasattr(user.role, 'value'):
                    role_value = user.role.value.upper()
                else:
                    role_value = str(user.role).upper()
                
                if role_value in role_mapping and role_mapping[role_value]:
                    user.role_id = role_mapping[role_value]
                    print(f"  - Migrated user {user.username} to role_id {user.role_id}")
                else:
                    # Default to viewer role
                    user.role_id = viewer_role.id if viewer_role else None
                    print(f"  - Defaulted user {user.username} to viewer role")
        
        db.commit()
        print("✅ RBAC migration completed successfully!")
        
        # Display summary
        print("\n📊 Migration Summary:")
        print(f"  - Roles created: {db.query(Role).count()}")
        print(f"  - Permissions created: {db.query(RBACPermission).count()}")
        print(f"  - Users migrated: {len(users)}")
        
        print("\n🔍 Roles and their permissions:")
        roles = db.query(Role).all()
        for role in roles:
            print(f"  - {role.display_name} ({role.name}): {len(role.permissions)} permissions")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error during RBAC migration: {e}")
        raise e
    finally:
        db.close()

def verify_migration():
    """Verify that the migration was successful"""
    
    print("\n🔍 Verifying migration...")
    
    db = next(get_db())
    
    try:
        # Check tables exist and have data
        roles_count = db.query(Role).count()
        permissions_count = db.query(RBACPermission).count()
        users_with_role_id = db.query(User).filter(User.role_id.isnot(None)).count()
        
        print(f"  - Roles in database: {roles_count}")
        print(f"  - Permissions in database: {permissions_count}")
        print(f"  - Users with role_id: {users_with_role_id}")
        
        # Test a user's effective permissions
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user and admin_user.role:
            effective_perms = admin_user.permissions
            print(f"  - Admin user effective permissions: {len(effective_perms)}")
        
        if roles_count >= 4 and permissions_count >= 14 and users_with_role_id > 0:
            print("✅ Migration verification successful!")
            return True
        else:
            print("⚠️  Migration verification found issues")
            return False
            
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting RBAC Migration...")
    print("=" * 50)
    
    try:
        # Step 1: Create tables
        print("1️⃣  Creating RBAC tables...")
        create_rbac_tables()
        
        # Step 2: Populate data and migrate users
        print("\n2️⃣  Populating RBAC data...")
        populate_rbac_data()
        
        # Step 3: Verify migration
        print("\n3️⃣  Verifying migration...")
        success = verify_migration()
        
        if success:
            print("\n🎉 RBAC Migration completed successfully!")
            print("\nNext steps:")
            print("  1. Update application code to use role_id instead of role enum")
            print("  2. Test all authentication and authorization flows")
            print("  3. Consider removing the old 'role' column after testing")
        else:
            print("\n❌ Migration completed with issues. Please review the output above.")
            
    except Exception as e:
        print(f"\n💥 Migration failed: {e}")
        import traceback
        traceback.print_exc()