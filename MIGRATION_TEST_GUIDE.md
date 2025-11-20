# localStorage to Backend Migration - Testing Guide

This guide validates the complete migration from localStorage to backend persistence for the RaizBrasil E-commerce platform.

## Overview

The migration includes:
- **JWT Authentication** with custom HS256 implementation
- **Backend Cart Management** with database persistence
- **User Profile with Address** stored in backend
- **Orders Integration** with full persistence
- **Wishlist/Saved Items** management
- **Smart Product Caching** with 15-minute TTL

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```
POST /api/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "password123"
}

Response (201):
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "isAdmin": false
  }
}
```

#### 2. Login User
```
POST /api/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "password123"
}

Response (200):
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "isAdmin": false
  }
}
```

#### 3. Get Current User
```
GET /api/me
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "isAdmin": false
}
```

### Cart Endpoints (Authenticated)

#### 4. Get User's Cart
```
GET /api/cart
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "user_id": 1,
  "items": [
    {
      "id": 10,
      "product_id": 1,
      "product": {
        "id": 1,
        "title": "Camiseta Raiz Brasil",
        "price": 139.90
      },
      "qty": 2,
      "size": "M"
    }
  ]
}
```

#### 5. Add Item to Cart
```
POST /api/cart/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": 1,
  "qty": 1,
  "size": "M"
}

Response (201):
{
  "id": 1,
  "user_id": 1,
  "items": [...]
}
```

#### 6. Update Cart Item
```
PUT /api/cart/items/{itemId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "qty": 3
}

Response (200):
{
  "id": 1,
  "user_id": 1,
  "items": [...]
}
```

#### 7. Remove Item from Cart
```
DELETE /api/cart/items/{itemId}
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "user_id": 1,
  "items": [...]
}
```

#### 8. Clear Cart
```
DELETE /api/cart
Authorization: Bearer {token}

Response (200):
{
  "success": true
}
```

### User Profile Endpoints (Authenticated)

#### 9. Get User Profile
```
GET /api/users/me
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 456",
  "city": "São Paulo",
  "state": "SP",
  "zip": "01234567"
}
```

#### 10. Update User Profile
```
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva Updated",
  "phone": "11987654322",
  "street": "Nova Rua",
  "number": "456",
  "city": "São Paulo",
  "state": "SP",
  "zip": "01234568"
}

Response (200):
{
  "id": 1,
  "name": "João Silva Updated",
  "email": "joao@example.com",
  "phone": "11987654322",
  ...
}
```

### Saved Items/Wishlist Endpoints (Authenticated)

#### 11. List Saved Items
```
GET /api/saved
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 5,
    "user_id": 1,
    "product_id": 2,
    "product": {
      "id": 2,
      "title": "Camiseta Raiz Brasil Azul",
      "price": 139.90
    },
    "size": "G"
  }
]
```

#### 12. Add Item to Wishlist
```
POST /api/saved
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": 2,
  "size": "G"
}

Response (201):
{
  "id": 5,
  "user_id": 1,
  "product_id": 2,
  "product": {...},
  "size": "G"
}
```

#### 13. Remove Item from Wishlist
```
DELETE /api/saved/{itemId}
Authorization: Bearer {token}

Response (200):
{
  "success": true
}
```

#### 14. Clear Wishlist
```
DELETE /api/saved/clear
Authorization: Bearer {token}

Response (200):
{
  "success": true
}
```

### Orders Endpoints (Authenticated)

#### 15. List User's Orders
```
GET /api/orders
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 1,
    "user_id": 1,
    "status": "pago",
    "subtotal": 279.80,
    "shipping_cost": 0,
    "total": 279.80,
    "payment_method": "cartao",
    "created_at": "2025-11-19T10:30:00Z",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "title": "Camiseta Raiz Brasil",
        "price": 139.90,
        "qty": 2,
        "size": "M"
      }
    ]
  }
]
```

#### 16. Create Order
```
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "address_id": 1,
  "payment_method": "cartao",
  "items": [
    {
      "product_id": 1,
      "qty": 2,
      "size": "M"
    }
  ]
}

Response (201):
{
  "id": 1,
  "user_id": 1,
  "status": "novo",
  "subtotal": 279.80,
  "total": 279.80,
  ...
}
```

#### 17. Get Order Details
```
GET /api/orders/{orderId}
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "user_id": 1,
  "status": "pago",
  ...
}
```

#### 18. Update Order Status (Admin)
```
POST /api/orders/{orderId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "processando"
}

Response (200):
{
  "success": true
}
```

#### 19. Delete Order (Admin)
```
DELETE /api/orders/{orderId}
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true
}
```

### Product Endpoints (Public)

#### 20. List All Products
```
GET /api/products

Response (200):
[
  {
    "id": 1,
    "title": "Camiseta Raiz Brasil",
    "price": 139.90,
    "category": "Masculina",
    "description": "...",
    "images": ["/path/to/image.jpg"]
  }
]
```

#### 21. Get Product Details
```
GET /api/products/{productId}

Response (200):
{
  "id": 1,
  "title": "Camiseta Raiz Brasil",
  "price": 139.90,
  ...
}
```

## Frontend localStorage Keys (After Migration)

The migration reduces localStorage dependency to essential tokens only:

### Stored in localStorage:
1. **`rb_token_v1`** - JWT authentication token (replaces passwords)
2. **`rb_current_user`** - Cached current user data (for quick access)
3. **`rb_products_cache`** - Product list cache (TTL-based, 15 min expiry)
4. **`rb_products_ttl`** - Product cache TTL timestamp

### NO LONGER in localStorage (moved to backend):
- ~~`rb_users_v1`~~ → Backend `users` table
- ~~`rb_cart_v2`~~ → Backend `carts` + `cart_items` tables
- ~~`rb_orders_v1`~~ → Backend `orders` + `order_items` tables
- ~~`rb_saved_v1`~~ → Backend `saved_items` table
- ~~`rb_api_base`~~ → Configured in frontend environment

## JWT Token Structure

The custom JWT implementation uses HS256 algorithm:

```
Header: {
  "typ": "JWT",
  "alg": "HS256"
}

Payload: {
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1700000000,
  "exp": 1700086400
}

Signature: HMACSHA256(
  base64(header) + "." + base64(payload),
  "JWT_SECRET"
)
```

## Hybrid Architecture

The frontend implements a hybrid caching strategy:

### For Authenticated Users:
1. All sensitive data (cart, orders, profile) stored on backend
2. JWT token cached in localStorage for session persistence
3. Automatic API calls with Authorization header
4. User data cached locally for quick display

### For Guest Users:
1. Cart, orders, saved items stored in localStorage
2. Products fetched from backend with TTL caching
3. No authentication required for product browsing
4. Automatic sync to backend when user registers/logs in

## Testing Checklist

### Authentication Flow
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Attempt login with invalid password (should fail)
- [ ] Get current user with valid token
- [ ] Attempt API call without token (should return 401)

### Cart Management
- [ ] Add item to authenticated user's cart
- [ ] Cart quantity auto-increments for duplicate items
- [ ] Update item quantity
- [ ] Remove specific item
- [ ] Clear entire cart
- [ ] Verify cart persists across page refresh

### User Profile
- [ ] View user profile information
- [ ] Update user name and phone
- [ ] Update address information
- [ ] Verify all fields are validated

### Wishlist
- [ ] Add item to wishlist
- [ ] Prevent duplicate items (same product+size)
- [ ] Remove item from wishlist
- [ ] Clear entire wishlist

### Orders
- [ ] Create new order from cart items
- [ ] View order history
- [ ] Order items show correct details
- [ ] Order status displays correctly

### Product Caching
- [ ] First product load fetches from backend
- [ ] Subsequent loads use cache (within 15 minutes)
- [ ] Cache expires after TTL
- [ ] Sample products display if backend is down

### Cross-Device Sync
- [ ] Login on device A
- [ ] Login on device B (different browser)
- [ ] Add item to cart on device A
- [ ] Switch to device B, cart is loaded from backend
- [ ] Both devices show same cart items

## Error Handling

The system handles these error scenarios:

### 401 Unauthorized
- Missing Bearer token
- Invalid/expired JWT token
- User account deleted

### 404 Not Found
- Invalid product ID
- Order not found
- Item not in cart/wishlist

### 422 Unprocessable Entity
- Missing required fields
- Invalid email format
- Invalid address data

### 500 Server Error
- Database connection failed
- Unexpected server error
- Environment configuration missing

## Performance Metrics

Expected performance characteristics:

- Product list load: < 200ms (with cache)
- Cart operations: < 100ms (backend API)
- Authentication: < 150ms (JWT decode/verification)
- Product cache TTL: 15 minutes (configurable)

## Security Features

1. **Password Hashing**: BCrypt with salt
2. **Token Security**: 24-hour expiration, HS256 signature
3. **CORS**: Configurable origin restrictions
4. **Authorization**: Middleware validation on all protected endpoints
5. **Input Validation**: Type-safe parameters in all controllers
6. **SQL Injection Prevention**: Prepared statements in all queries
