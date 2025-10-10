# API REST Requests in Workspace

This document lists all API REST requests found in the frontend applications.

## Frontend Web (React)

### Authentication Service (localhost:8000)
- **POST** `/api/v1/auth/token`
  - Purpose: User login
  - Payload: `{ username, password }`
  - Response: `{ access_token }`
  - Used in: Login component

### POS Service (localhost:8001)

#### Inventory Endpoints
- **GET** `/api/v1/inventory/`
  - Purpose: Retrieve products list
  - Headers: Authorization Bearer token
  - Response: Array of products
  - Used in: POS component (getProducts)

- **POST** `/api/v1/inventory/`
  - Purpose: Create new product
  - Headers: Authorization Bearer token
  - Payload: Product data
  - Response: Created product
  - Used in: POS component (createProduct)

#### Sales Endpoints
- **POST** `/api/v1/sales/`
  - Purpose: Create new sale
  - Headers: Authorization Bearer token
  - Payload: `{ items, branch_id, user_id, payment_method, discount_amount }`
  - Response: Sale data
  - Used in: POS component (createSale)

- **GET** `/api/v1/sales/`
  - Purpose: Retrieve sales list
  - Headers: Authorization Bearer token
  - Response: Array of sales
  - Used in: POS slice (getSales)

## Frontend Mobile (React Native)

### Authentication Service (localhost:8000)
- **POST** `/api/v1/auth/token`
  - Purpose: User login
  - Payload: `{ username, password }`
  - Response: `{ access_token }`
  - Used in: LoginScreen component

### POS Service (localhost:8001)

#### Sales Endpoints
- **POST** `/api/v1/sales/`
  - Purpose: Create new sale
  - Headers: Authorization Bearer token
  - Payload: `{ items, branch_id, user_id, payment_method, discount_amount }`
  - Response: Sale data
  - Used in: POSScreen component

## Summary

Total unique API endpoints: 4

- Authentication: 1 endpoint
- Inventory: 2 endpoints
- Sales: 1 endpoint (used in both POST and GET)

Services:
- User Service: Handles authentication
- POS Service: Handles inventory and sales