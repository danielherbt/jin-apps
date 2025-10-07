# POS Microservices System

A scalable Point of Sale system built with microservices architecture for electronic invoicing in Ecuador.

## Architecture

### Services
- **User Management Service**: Handles user authentication, roles, and permissions
- **POS Service**: Core POS operations including sales, inventory, and branch management
- **Invoicing Service**: Electronic invoicing with XML generation, digital signing, and SRI authorization
- **API Gateway**: Unified entry point for all services

### Technology Stack
- **Backend**: Python 3.11, FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: React (web), React Native (mobile)
- **Infrastructure**: Docker, Kubernetes, RabbitMQ
- **Authentication**: JWT
- **Communication**: REST APIs, Message Queues

### Key Features
- Multi-branch support
- Electronic invoicing compliant with SRI requirements
- Digital XML signing
- Scalable microservices architecture
- Modern React/React Native interfaces

## Project Structure
```
pos-microservices/
├── user-service/
├── pos-service/
├── invoicing-service/
├── gateway-service/
├── frontend-web/
├── frontend-mobile/
├── docker/
├── k8s/
└── docs/
```

## Getting Started

1. Clone the repository
2. Set up Docker environment
## CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline using GitHub Actions:

### Features
- **Automated Testing**: Runs pytest for all microservices with coverage reporting
- **Docker Build & Push**: Builds and pushes Docker images to GitHub Container Registry
- **Multi-Environment Deployment**: Separate staging and production deployments
- **Code Quality**: Integrated testing and linting

### Workflow Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` branch

### Local Development
Use the provided Makefile for local testing:

```bash
# Run all tests
make test

# Build services
make build

# Start services
make up

# Stop services
make down

# Clean up
make clean
```

### Deployment
- **Staging**: Automatic deployment on pushes to `develop` branch
- **Production**: Automatic deployment on pushes to `main` branch

## Project Structure
```
pos-microservices/
├── user-service/           # User management & authentication
├── pos-service/            # Core POS operations
├── invoicing-service/      # Electronic invoicing & SRI integration
├── frontend-web/           # React web application
├── frontend-mobile/        # React Native mobile app
├── docker-compose.yml      # Local development setup
├── docker-compose.test.yml # Testing environment
├── .github/workflows/      # CI/CD pipelines
└── Makefile               # Development commands
```
3. Run `docker-compose up` for development
4. Access services via API Gateway

## Development

Each service follows Clean Architecture principles with:
- Domain layer
- Application layer
- Infrastructure layer
- Tests for each layer