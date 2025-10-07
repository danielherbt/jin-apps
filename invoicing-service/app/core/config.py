from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Invoicing Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/invoicingdb"

    # External services
    POS_SERVICE_URL: str = "http://pos-service:8001"

    # SRI Configuration
    SRI_ENVIRONMENT: str = "test"  # test or production
    SRI_RECEPCION_URL_TEST: str = "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline"
    SRI_AUTORIZACION_URL_TEST: str = "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline"
    SRI_RECEPCION_URL_PROD: str = "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline"
    SRI_AUTORIZACION_URL_PROD: str = "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline"

    # Digital signature
    CERTIFICATE_PATH: str = "/app/certs/certificate.p12"
    CERTIFICATE_PASSWORD: str = "password"

    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"

    class Config:
        env_file = ".env"

settings = Settings()