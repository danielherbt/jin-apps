#!/usr/bin/env python3
"""
Fix user migration to RBAC - Update role_id for existing users
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.rbac import Role
from app.models.user import User
from app.db.session import get_db

def fix_user_role_migration():
    """Fix migration of users to new role_id system"""
    
    print("🔧 Fixing user role migration...")
    
    db = next(get_db())
    
    try:
        # Get all roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        manager_role = db.query(Role).filter(Role.name == "manager").first()
        cashier_role = db.query(Role).filter(Role.name == "cashier").first()
        viewer_role = db.query(Role).filter(Role.name == "viewer").first()
        
        if not all([admin_role, manager_role, cashier_role, viewer_role]):
            print("❌ Not all roles found in database")
            return False
        
        # Get all users without role_id
        users = db.query(User).filter(User.role_id.is_(None)).all()
        
        print(f"Found {len(users)} users to migrate")
        
        updated_count = 0
        
        # Use raw SQL to access the old role column
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Get users with their current role
            result = conn.execute(text("SELECT id, username, role FROM users WHERE role_id IS NULL"))
            users_data = result.fetchall()
            
            for user_data in users_data:
                user_id, username, old_role = user_data
                
                # Map string role to role_id
                role_mapping = {
                    "ADMIN": admin_role.id,
                    "MANAGER": manager_role.id,
                    "CASHIER": cashier_role.id,
                    "VIEWER": viewer_role.id
                }
                
                new_role_id = role_mapping.get(old_role, viewer_role.id)
                
                # Update role_id
                conn.execute(text(
                    "UPDATE users SET role_id = :role_id WHERE id = :user_id"
                ), {"role_id": new_role_id, "user_id": user_id})
                
                print(f"  ✅ Migrated {username}: {old_role} -> role_id {new_role_id}")
                updated_count += 1
            
            conn.commit()
        
        print(f"\n✅ Successfully migrated {updated_count} users!")
        
        # Verify migration
        users_with_role_id = db.query(User).filter(User.role_id.isnot(None)).count()
        print(f"📊 Total users with role_id: {users_with_role_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing user migration: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def verify_rbac_system():
    """Verify the complete RBAC system is working"""
    
    print("\n🔍 Verifying complete RBAC system...")
    
    db = next(get_db())
    
    try:
        # Check counts
        roles_count = db.query(Role).count()
        from app.models.rbac import Permission as RBACPermission
        permissions_count = db.query(RBACPermission).count()
        users_with_role_id = db.query(User).filter(User.role_id.isnot(None)).count()
        total_users = db.query(User).count()
        
        print(f"  📋 Roles: {roles_count}")
        print(f"  🔑 Permissions: {permissions_count}")
        print(f"  👥 Users with role_id: {users_with_role_id}/{total_users}")
        
        # Test a specific user's permissions
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user and admin_user.role:
            print(f"  🔧 Admin user role: {admin_user.role.name}")
            print(f"  📝 Admin permissions: {len(admin_user.role.get_permission_names())}")
        
        # Test role-permission relationships
        for role in db.query(Role).all():
            perm_count = len(role.permissions)
            print(f"  • {role.display_name}: {perm_count} permissions")
        
        success = (roles_count >= 4 and 
                  permissions_count >= 20 and 
                  users_with_role_id == total_users)
        
        if success:
            print("\n🎉 RBAC system verification PASSED!")
        else:
            print("\n⚠️  RBAC system verification has issues")
        
        return success
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting RBAC User Migration Fix...")
    print("=" * 50)
    
    success = fix_user_role_migration()
    
    if success:
        verify_rbac_system()
        print("\n✅ RBAC migration fix completed successfully!")
    else:
        print("\n❌ RBAC migration fix failed!")