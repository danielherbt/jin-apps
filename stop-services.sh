#!/bin/bash

echo "🛑 Deteniendo servicios POS..."

# Leer PIDs y detener servicios
if [ -f logs/user-service.pid ]; then
    USER_PID=$(cat logs/user-service.pid)
    echo "Deteniendo User Service (PID: $USER_PID)..."
    kill $USER_PID 2>/dev/null || echo "User Service ya estaba detenido"
    rm logs/user-service.pid
fi

if [ -f logs/pos-service.pid ]; then
    POS_PID=$(cat logs/pos-service.pid)
    echo "Deteniendo POS Service (PID: $POS_PID)..."
    kill $POS_PID 2>/dev/null || echo "POS Service ya estaba detenido"
    rm logs/pos-service.pid
fi

if [ -f logs/invoicing-service.pid ]; then
    INVOICING_PID=$(cat logs/invoicing-service.pid)
    echo "Deteniendo Invoicing Service (PID: $INVOICING_PID)..."
    kill $INVOICING_PID 2>/dev/null || echo "Invoicing Service ya estaba detenido"
    rm logs/invoicing-service.pid
fi

# Alternativa: matar todos los procesos uvicorn
echo "Verificando procesos uvicorn restantes..."
pkill -f "uvicorn.*app.main:app" 2>/dev/null || echo "No hay procesos uvicorn ejecutándose"

echo "✅ Servicios detenidos correctamente."
