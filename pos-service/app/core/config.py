from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "POS Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/posdb"

    # External services
    USER_SERVICE_URL: str = "http://user-service:8000"
    # INVOICING_SERVICE_URL removed to break circular dependency
    # Communication with invoicing service will be via events/messages

    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"

    class Config:
        env_file = ".env"

settings = Settings()