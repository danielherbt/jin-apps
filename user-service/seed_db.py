#!/usr/bin/env python3
"""
Script para poblar la base de datos con usuarios de ejemplo con diferentes roles
"""
import sys
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Agregar el path del user-service
sys.path.append(os.path.join(os.path.dirname(__file__), 'user-service'))

from app.models.user import User, UserRole, Base
#from app.core.security import get_password_hash

# Configuración de la base de datos
DATABASE_URL = "postgresql://user:password@localhost:5432/userdb"

def create_sample_users():
    """Crear usuarios de ejemplo con diferentes roles"""
    
    users_data = [
        {
            "username": "admin",
            "email": "admin@possystem.com",
            "full_name": "System Administrator",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "is_superuser": True,
            "is_active": True,
            "branch_id": None  # Acceso a todas las sucursales
        },
        {
            "username": "manager1",
            "email": "manager1@possystem.com",
            "full_name": "Store Manager",
            "password": "manager123",
            "role": UserRole.MANAGER,
            "is_superuser": False,
            "is_active": True,
            "branch_id": 1  # Sucursal específica
        },
        {
            "username": "cashier1",
            "email": "cashier1@possystem.com",
            "full_name": "John Cashier",
            "password": "cashier123",
            "role": UserRole.CASHIER,
            "is_superuser": False,
            "is_active": True,
            "branch_id": 1  # Sucursal 1
        },
        {
            "username": "cashier2",
            "email": "cashier2@possystem.com",
            "full_name": "Jane Cashier",
            "password": "cashier123",
            "role": UserRole.CASHIER,
            "is_superuser": False,
            "is_active": True,
            "branch_id": 2  # Sucursal 2
        },
        {
            "username": "viewer1",
            "email": "viewer1@possystem.com",
            "full_name": "Report Viewer",
            "password": "viewer123",
            "role": UserRole.VIEWER,
            "is_superuser": False,
            "is_active": True,
            "branch_id": None  # Puede ver todas las sucursales (solo lectura)
        },
        {
            "username": "manager2",
            "email": "manager2@possystem.com",
            "full_name": "Regional Manager",
            "password": "manager123",
            "role": UserRole.MANAGER,
            "is_superuser": False,
            "is_active": True,
            "branch_id": None  # Acceso a todas las sucursales
        },
        {
            "username": "testuser",
            "email": "test@possystem.com",
            "full_name": "Test User",
            "password": "test123",
            "role": UserRole.VIEWER,
            "is_superuser": False,
            "is_active": False,  # Usuario inactivo para pruebas
            "branch_id": 1
        }
    ]
    
    return users_data

def seed_database():
    """Poblar la base de datos con datos de ejemplo"""
    print("🌱 Iniciando seed de la base de datos...")
    print("=" * 60)
    
    # Crear conexión a la base de datos
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("✅ Conexión a PostgreSQL establecida")
        
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False
    
    try:
        # Verificar si ya existen usuarios
        existing_users_count = db.query(User).count()
        
        if existing_users_count > 0:
            print(f"ℹ️ La base de datos ya tiene {existing_users_count} usuarios")
            response = input("¿Deseas continuar y agregar más usuarios? (y/N): ")
            if response.lower() != 'y':
                print("❌ Operación cancelada")
                return False
        
        # Crear usuarios de ejemplo
        users_data = create_sample_users()
        created_count = 0
        skipped_count = 0
        
        for user_data in users_data:
            # Verificar si el usuario ya existe
            existing_user = db.query(User).filter(
                (User.username == user_data["username"]) |
                (User.email == user_data["email"])
            ).first()
            
            if existing_user:
                print(f"⚠️ Usuario {user_data['username']} ya existe, saltando...")
                skipped_count += 1
                continue
            
            # Crear nuevo usuario
            #hashed_password = get_password_hash(user_data["password"])
            
            new_user = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=user_data["password"],
                role=user_data["role"],
                is_superuser=user_data["is_superuser"],
                is_active=user_data["is_active"],
                branch_id=user_data["branch_id"]
            )
            
            db.add(new_user)
            created_count += 1
            
            # Información del usuario creado
            branch_info = f"Branch {user_data['branch_id']}" if user_data['branch_id'] else "All branches"
            status = "Active" if user_data["is_active"] else "Inactive"
            superuser = " (SUPERUSER)" if user_data["is_superuser"] else ""
            
            print(f"✅ {user_data['username']} - {user_data['role'].value}{superuser} - {branch_info} - {status}")
        
        # Commit de todos los cambios
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"🎉 Seed completado exitosamente!")
        print(f"📊 Estadísticas:")
        print(f"   - Usuarios creados: {created_count}")
        print(f"   - Usuarios saltados (ya existían): {skipped_count}")
        print(f"   - Total usuarios en BD: {db.query(User).count()}")
        
        # Mostrar resumen de usuarios por rol
        print(f"\n👥 Usuarios por rol:")
        for role in UserRole:
            count = db.query(User).filter(User.role == role).count()
            if count > 0:
                print(f"   - {role.value}: {count} usuario(s)")
        
        # Mostrar credenciales para testing
        print(f"\n🔐 Credenciales para testing:")
        print("=" * 60)
        for user_data in users_data:
            if created_count > 0:  # Solo mostrar si se crearon usuarios
                print(f"Username: {user_data['username']:<12} | Password: {user_data['password']:<12} | Role: {user_data['role'].value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante el seed: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def verify_database():
    """Verificar que la base de datos esté correctamente poblada"""
    print("\n🔍 Verificando estado de la base de datos...")
    print("-" * 60)
    
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Verificar usuarios
        users = db.query(User).all()
        
        if not users:
            print("❌ No hay usuarios en la base de datos")
            return False
        
        print(f"✅ Base de datos verificada - {len(users)} usuarios encontrados")
        
        # Verificar roles
        print(f"\n📋 Distribución por roles:")
        for role in UserRole:
            users_with_role = db.query(User).filter(User.role == role).all()
            if users_with_role:
                print(f"   {role.value}: {len(users_with_role)} usuario(s)")
                for user in users_with_role:
                    status = "✅" if user.is_active else "❌"
                    superuser = "👑" if user.is_superuser else "👤"
                    branch = f"🏢{user.branch_id}" if user.branch_id else "🏢All"
                    print(f"      {superuser} {status} {user.username} ({user.full_name}) - {branch}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando la base de datos: {e}")
        return False
        
    finally:
        db.close()

def main():
    """Función principal"""
    print("🔐 Script de Seed - Sistema POS JWT con Roles")
    print("=" * 60)
    print("Este script poblará la base de datos con usuarios de ejemplo")
    print("para probar el sistema JWT con diferentes roles y permisos.")
    print("=" * 60)
    
    # Ejecutar seed
    success = seed_database()
    
    if success:
        # Verificar la base de datos
        #verify_database()
        
        print("\n" + "=" * 60)
        print("🎯 ¡Base de datos lista para testing JWT!")
        print("=" * 60)
        print("📋 Próximos pasos:")
        print("1. Ejecutar: python test-jwt-system.py")
        print("2. Probar login con las credenciales mostradas arriba")
        print("3. Verificar permisos por rol en el dashboard web")
        print("=" * 60)
    else:
        print("\n❌ Error durante el seed. Revisar la configuración.")

if __name__ == "__main__":
    main()