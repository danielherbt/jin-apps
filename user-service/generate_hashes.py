#!/usr/bin/env python3

from passlib.context import CryptContext

# Crear contexto
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Contraseñas para hashear
passwords = {
    "admin123": "admin",
    "manager123": "manager1", 
    "cashier123": "cashier1",
    "viewer123": "viewer1"
}

print("Generating bcrypt hashes:")
print("=" * 50)

for password, user in passwords.items():
    try:
        hashed = pwd_context.hash(password)
        print(f"{user}: {hashed}")
    except Exception as e:
        print(f"Error hashing password for {user}: {e}")

print("=" * 50)