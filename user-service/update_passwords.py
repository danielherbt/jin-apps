#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User
from sqlalchemy.orm import Session

def update_user_passwords():
    """Actualizar contraseñas de usuarios existentes a bcrypt hash"""
    
    db = next(get_db())
    
    try:
        users = db.query(User).all()
        
        updated_count = 0
        
        for user in users:
            # Mapeo de usuarios de prueba con sus contraseñas
            test_passwords = {
                "manager1": "manager123",
                "manager2": "manager123", 
                "cashier1": "cashier123",
                "cashier2": "cashier123",
                "viewer1": "viewer123"
            }
            
            if user.username in test_passwords:
                plain_password = test_passwords[user.username]
                
                # Verificar si ya está hasheada (bcrypt hashes empiezan con $2b$ y tienen ~60 caracteres)
                if not user.hashed_password.startswith('$2b$'):
                    print(f"Updating password for user: {user.username}")
                    
                    # Hashear la contraseña (limitando a 72 bytes para bcrypt)
                    user.hashed_password = get_password_hash(plain_password[:72])
                    updated_count += 1
                else:
                    print(f"User {user.username} already has bcrypt hash")
        
        # Crear usuario admin si no existe con contraseña hasheada
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            from app.models.user import UserRole
            print("Creating admin user...")
            
            admin_user = User(
                username="admin",
                email="admin@possystem.com", 
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"[:72]),  # Contraseña por defecto
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            updated_count += 1
        else:
            if not admin_user.hashed_password.startswith('$2b$'):
                print("Updating admin password...")
                admin_user.hashed_password = get_password_hash("admin123"[:72])
                updated_count += 1
            else:
                print("Admin user already has bcrypt hash")
        
        if updated_count > 0:
            db.commit()
            print(f"\n✅ Updated {updated_count} user passwords successfully!")
        else:
            print("No passwords needed updating.")
            
        # Mostrar usuarios actualizados
        print("\n📋 Current users in database:")
        users = db.query(User).all()
        for user in users:
            hash_type = "bcrypt" if user.hashed_password.startswith('$2b$') else "plaintext"
            print(f"  - {user.username} ({user.role.value}) - Password: {hash_type}")
    
    except Exception as e:
        print(f"❌ Error updating passwords: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔐 Updating user passwords to bcrypt hashes...")
    update_user_passwords()