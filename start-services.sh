#!/bin/bash

echo "🚀 Iniciando servicios POS en modo desarrollo local..."

# Activar entorno virtual
source venv/bin/activate

echo "📦 Instalando dependencias faltantes..."
pip install httpx requests lxml cryptography alembic pytest pytest-cov

# Crear directorio para logs
mkdir -p logs

echo "🔧 Iniciando User Service (Puerto 8000)..."
cd user-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/user-service.log 2>&1 &
USER_PID=$!
echo "User Service iniciado con PID: $USER_PID"
cd ..

echo "⏰ Esperando User Service..."
sleep 3

echo "🔧 Iniciando POS Service (Puerto 8001)..."
cd pos-service  
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../logs/pos-service.log 2>&1 &
POS_PID=$!
echo "POS Service iniciado con PID: $POS_PID"
cd ..

echo "⏰ Esperando POS Service..."
sleep 3

echo "🔧 Iniciando Invoicing Service (Puerto 8002)..."
cd invoicing-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload > ../logs/invoicing-service.log 2>&1 &
INVOICING_PID=$!
echo "Invoicing Service iniciado con PID: $INVOICING_PID"
cd ..

# Guardar PIDs para poder detener los servicios después
echo $USER_PID > logs/user-service.pid
echo $POS_PID > logs/pos-service.pid  
echo $INVOICING_PID > logs/invoicing-service.pid

echo "⏰ Esperando que los servicios se inicien..."
sleep 5

echo "🏥 Verificando health checks..."
echo "User Service Health:"
curl -s http://localhost:8000/health || echo "❌ User service no disponible"

echo "POS Service Health:"  
curl -s http://localhost:8001/health || echo "❌ POS service no disponible"

echo "Invoicing Service Health:"
curl -s http://localhost:8002/health || echo "❌ Invoicing service no disponible"

echo ""
echo "✅ Servicios iniciados. Logs disponibles en:"
echo "   - logs/user-service.log"
echo "   - logs/pos-service.log"
echo "   - logs/invoicing-service.log"
echo ""
echo "🔍 Para detener los servicios, ejecuta: ./stop-services.sh"
echo "🌐 Endpoints disponibles:"
echo "   - User Service: http://localhost:8000"
echo "   - POS Service: http://localhost:8001" 
echo "   - Invoicing Service: http://localhost:8002"

### Iniciar la aplicacion frontend-web
##cd frontend-web && npm start

