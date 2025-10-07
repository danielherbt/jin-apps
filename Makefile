.PHONY: test build up down clean

# Run all tests
test:
	docker-compose -f docker-compose.test.yml up -d
	sleep 10
	cd user-service && python -m pytest
	cd pos-service && python -m pytest
	cd invoicing-service && python -m pytest
	docker-compose -f docker-compose.test.yml down

# Build all services
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Run specific service tests
test-user:
	docker-compose -f docker-compose.test.yml up -d test-user-db
	sleep 5
	cd user-service && python -m pytest

test-pos:
	docker-compose -f docker-compose.test.yml up -d test-pos-db
	sleep 5
	cd pos-service && python -m pytest

test-invoicing:
	docker-compose -f docker-compose.test.yml up -d test-invoicing-db
	sleep 5
	cd invoicing-service && python -m pytest