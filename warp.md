# Warp AI - Contexto del Proyecto POS Microservicios

## 🏗️ Descripción General
Sistema de Punto de Venta escalable construido con arquitectura de microservicios para facturación electrónica en Ecuador.

**Ubicación**: `/home/daniel/Documents`
**Repositorio**: Sistema POS con microservicios
**Propósito**: Facturación electrónica conforme a regulaciones SRI de Ecuador

---

## 🎯 Arquitectura del Sistema

### Microservicios Backend
- **user-service** (Puerto 8000): Autenticación, gestión de usuarios y permisos
- **pos-service** (Puerto 8001): Operaciones POS centrales, ventas, inventario, sucursales
- **invoicing-service** (Puerto 8002): Facturación electrónica, generación XML, firma digital, autorización SRI

### Frontend Applications
- **frontend-web/**: Aplicación React para escritorio
- **frontend-mobile/**: Aplicación React Native con Expo para móviles

### Infraestructura
- **PostgreSQL**: 3 bases de datos independientes (puertos 5432, 5433, 5434)
- **RabbitMQ**: Cola de mensajes (puerto 5672, management 15672)
- **Docker**: Containerización completa
- **GitHub Actions**: CI/CD pipeline

---

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.11
- **Framework**: FastAPI
- **Base de datos**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0.23 + Alembic 1.12.1
- **Autenticación**: JWT (python-jose)
- **Mensajería**: RabbitMQ
- **Testing**: pytest + pytest-cov

### Frontend Web
- **Framework**: React 18.2.0
- **UI Library**: Material-UI v5.14.20
- **Estado**: Redux Toolkit 1.9.7
- **Routing**: React Router DOM 6.16.0
- **HTTP Client**: Axios 1.5.1

### Frontend Mobile
- **Framework**: React Native 0.72.6
- **Platform**: Expo ~49.0.15
- **Navigation**: React Navigation 6.x
- **Estado**: Redux Toolkit 1.9.7

### DevOps
- **Containerización**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry
- **Orquestación**: Kubernetes ready

---

## 📁 Estructura de Archivos

```
/home/daniel/Documents/
├── .github/workflows/
│   └── ci-cd.yml                    # Pipeline CI/CD completo
├── user-service/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py                  # FastAPI app - autenticación
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_auth.py
│   ├── Dockerfile
│   ├── requirements.txt             # Dependencies Python
│   └── init-db.py
├── pos-service/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py                  # FastAPI app - POS operations
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── init-db.py
├── invoicing-service/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py                  # FastAPI app - SRI invoicing
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── init-db.py
├── frontend-web/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json                 # React dependencies
├── frontend-mobile/
│   ├── App.js                       # React Native main component
│   └── package.json                 # RN + Expo dependencies
├── docker-compose.yml               # Desarrollo local
├── docker-compose.test.yml          # Entorno de testing
├── Makefile                         # Comandos de desarrollo
├── README.md                        # Documentación principal
└── warp.md                          # Este archivo de contexto
```

---

## 🚀 Comandos de Desarrollo

### Makefile Commands
```bash
make test          # Ejecutar todos los tests con pytest
make build         # Construir todos los servicios Docker
make up            # Iniciar todos los servicios en modo desarrollo
make down          # Detener todos los servicios
make clean         # Limpiar contenedores y volúmenes
make test-user     # Test específico del user-service
make test-pos      # Test específico del pos-service
make test-invoicing # Test específico del invoicing-service
```

### Docker Compose
```bash
docker-compose up -d                    # Iniciar servicios
docker-compose -f docker-compose.test.yml up # Entorno de testing
docker-compose down -v                  # Detener y limpiar volúmenes
```

---

## 🔌 Puertos y Endpoints

### Servicios Backend
- **user-service**: http://localhost:8000
  - `/health` - Health check
  - `/api/v1/auth/*` - Endpoints de autenticación
- **pos-service**: http://localhost:8001  
  - `/health` - Health check
  - `/api/v1/sales/*` - Gestión de ventas
  - `/api/v1/inventory/*` - Gestión de inventario
  - `/api/v1/branches/*` - Gestión de sucursales
- **invoicing-service**: http://localhost:8002
  - `/health` - Health check
  - `/api/v1/invoices/*` - Facturación electrónica

### Bases de Datos
- **user-db**: localhost:5432 (userdb)
- **pos-db**: localhost:5433 (posdb)  
- **invoicing-db**: localhost:5434 (invoicingdb)
- **Credenciales**: user:password para todas

### Infraestructura
- **RabbitMQ**: localhost:5672 (AMQP), localhost:15672 (Management UI)
- **Credenciales RabbitMQ**: guest:guest

---

## 🔄 CI/CD Pipeline

### Triggers
- Push a `main` o `develop`
- Pull requests a `main`

### Jobs
1. **Test**: Ejecuta pytest en matriz para todos los servicios
2. **Build & Push**: Construye imágenes Docker y las sube a GHCR
3. **Deploy Staging**: Auto-deploy en push a `develop`
4. **Deploy Production**: Auto-deploy en push a `main`

### Features
- Coverage con Codecov
- Docker multi-stage builds
- Semantic versioning
- Environment-specific deployments

---

## 🧩 Dependencies Principales

### Python Services (Todas)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
pytest==7.4.3
pytest-cov==4.1.0
python-decouple==3.8
```

### User Service Específicas
```txt
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
```

### POS & Invoicing Services
```txt
httpx==0.25.0
```

### Invoicing Service Específicas
```txt
requests==2.31.0
cryptography==41.0.4
lxml==4.9.3
```

### Frontend Web
```json
{
  "react": "^18.2.0",
  "@mui/material": "^5.14.20",
  "@reduxjs/toolkit": "^1.9.7",
  "react-router-dom": "^6.16.0",
  "axios": "^1.5.1",
  "proxy": "http://localhost:8001"
}
```

### Frontend Mobile
```json
{
  "expo": "~49.0.15",
  "react": "18.2.0",
  "react-native": "0.72.6",
  "@react-navigation/native": "^6.1.9",
  "@reduxjs/toolkit": "^1.9.7"
}
```

---

## 🏛️ Arquitectura Clean Architecture

Cada servicio sigue principios de Clean Architecture:
- **Domain Layer**: Entidades y reglas de negocio
- **Application Layer**: Casos de uso
- **Infrastructure Layer**: Acceso a datos y servicios externos
- **Tests**: Cobertura para cada capa

---

## 🇪🇨 Características Específicas SRI Ecuador

### Invoicing Service
- Generación de XML conforme a especificaciones SRI
- Firma digital de documentos
- Autorización automática con SRI
- Soporte para ambiente de prueba (`SRI_ENVIRONMENT=test`)
- Integración con certificados digitales (`./certs` volume)

### Compliance Features
- Multi-branch support (sucursales)
- Electronic invoicing pipeline
- XML digital signing
- SRI authorization workflow

---

## 🔒 Variables de Entorno

### Database URLs
```bash
# User Service
DATABASE_URL=postgresql://user:password@user-db:5432/userdb

# POS Service  
DATABASE_URL=postgresql://user:password@pos-db:5432/posdb
USER_SERVICE_URL=http://user-service:8000
INVOICING_SERVICE_URL=http://invoicing-service:8002

# Invoicing Service
DATABASE_URL=postgresql://user:password@invoicing-db:5432/invoicingdb
POS_SERVICE_URL=http://pos-service:8001
SRI_ENVIRONMENT=test
```

### Message Queue
```bash
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
```

---

## 📝 Notas de Desarrollo

### Patrones Utilizados
- Microservices Architecture
- Clean Architecture per service
- Repository Pattern
- Dependency Injection
- Event-Driven Communication (RabbitMQ)

### Testing Strategy
- Unit tests con pytest
- Integration tests
- Coverage reporting
- CI/CD automated testing

### Deployment Strategy
- Containerized microservices
- Database per service
- Service mesh ready
- Kubernetes manifests ready (k8s/ folder expected)

---

## 🎯 Próximos Pasos Sugeridos

1. **Gateway Service**: Implementar API Gateway para unificar endpoints
2. **Kubernetes**: Completar manifests K8s para producción
3. **Monitoring**: Añadir Prometheus/Grafana
4. **Logging**: Centralizar logs con ELK stack
5. **Security**: Implementar OAuth2/OpenID Connect
6. **Documentation**: OpenAPI/Swagger para todos los endpoints

---

*Última actualización: 2025-01-07*
*Generado automáticamente por Warp AI*