# 🛠️ Corrección de Dependencia Circular

## ❌ Problema Identificado
**Dependency Cycle**: `invoicing-service ↔ pos-service`

### Arquitectura Incorrecta (Antes)
```
pos-service ────────→ invoicing-service
     ↑                        │
     └────────────────────────┘
```

## ✅ Solución Implementada

### Nueva Arquitectura (Event-Driven)
```
user-service (8000)
     ↓
pos-service (8001) ────→ [RabbitMQ] ────→ invoicing-service (8002)
                           Events            SRI Integration
```

### Principios Aplicados
1. **Eliminación de dependencias síncronas circulares**
2. **Comunicación asíncrona vía eventos (RabbitMQ)**
3. **Single Responsibility por servicio**
4. **Tolerancia a fallos mejorada**

## 🔄 Flujo Corregido

### Para una Venta/Factura:
1. **POS Service** procesa la venta
2. **POS Service** publica evento `SaleCompleted` a RabbitMQ
3. **Invoicing Service** escucha el evento
4. **Invoicing Service** genera la factura electrónica
5. **Invoicing Service** envía a SRI
6. **Invoicing Service** publica evento `InvoiceGenerated`

### Beneficios:
- ✅ No hay dependencias circulares
- ✅ Servicios pueden iniciarse independientemente
- ✅ Mejor tolerancia a fallos
- ✅ Escalabilidad mejorada
- ✅ Desacoplamiento entre servicios

## 🚀 Orden de Inicio
1. **Bases de datos** (PostgreSQL x3)
2. **Message Queue** (RabbitMQ)
3. **User Service** (independiente)
4. **POS Service** (depende de User Service)
5. **Invoicing Service** (independiente, escucha eventos)

## 🔧 Cambios Realizados

### Docker Compose
- Removido `depends_on: invoicing-service` de pos-service
- Removido `depends_on: pos-service` de invoicing-service
- Mantenido RabbitMQ como único punto de comunicación asíncrona

### Configuración
- Removido `INVOICING_SERVICE_URL` de pos-service
- Mantenido `RABBITMQ_URL` en ambos servicios

### Comunicación
- **Antes**: HTTP síncrono (circular)
- **Después**: Eventos asíncronos vía RabbitMQ

## 📋 TODO: Implementación Completa
- [ ] Implementar eventos en POS Service
- [ ] Implementar listeners en Invoicing Service
- [ ] Crear esquemas de eventos
- [ ] Implementar manejo de errores asíncrono
- [ ] Añadir monitoreo de eventos