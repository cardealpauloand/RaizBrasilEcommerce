# Migration Quick Start Guide

## What Changed?

**localStorage → Backend Database Migration**

All user data (carts, orders, profiles, wishlist) is now stored on the backend MySQL database instead of the browser's localStorage.

---

## For Developers

### Running the Application

#### Backend (PHP)
```bash
cd backend
php -S localhost:8000
```

#### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

### Environment Setup

#### Backend (.env)
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=raiz_brasil
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=*
APP_DEBUG=true
```

#### Frontend (vite.config.js or .env)
```
VITE_API_BASE=http://localhost:8000
```

### Database Setup

Run the schema to create tables:
```sql
mysql -u root < backend/sql/schema.mysql.sql
```

Or manually in MySQL client:
```mysql
mysql> USE raiz_brasil;
mysql> SOURCE backend/sql/schema.mysql.sql;
```

---

## For Testing

### Test the Complete Flow

1. **Register User**
   ```
   POST http://localhost:8000/api/register
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   Response: `{ token: "...", user: {...} }`

2. **Login**
   ```
   POST http://localhost:8000/api/login
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   Response: `{ token: "...", user: {...} }`

3. **Add to Cart** (requires token in Authorization header)
   ```
   POST http://localhost:8000/api/cart/items
   Authorization: Bearer {token}
   {
     "product_id": 1,
     "qty": 2,
     "size": "M"
   }
   ```

4. **Get Cart** (requires token)
   ```
   GET http://localhost:8000/api/cart
   Authorization: Bearer {token}
   ```

5. **Create Order** (requires token)
   ```
   POST http://localhost:8000/api/orders
   Authorization: Bearer {token}
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
   ```

See `MIGRATION_TEST_GUIDE.md` for complete testing scenarios.

---

## For Understanding the Architecture

### Frontend Data Flow

```
React Component
    ↓
Controller (AuthController, CartController, etc)
    ↓
Model (UserModel, CartModel, SavedItemModel)
    ↓
API Client (api.js - auto-adds JWT token)
    ↓
HTTP Request with Authorization header
```

### Backend Data Flow

```
HTTP Request → Router
    ↓
AuthMiddleware (validates JWT token)
    ↓
Controller (validates input)
    ↓
Model (database operations)
    ↓
Database (MySQL with constraints)
```

### Storage Strategy

**Authenticated Users:**
- Token: localStorage (rb_token_v1)
- User data: localStorage cache (rb_current_user) + backend
- Cart: backend database + localStorage fallback
- Orders: backend database
- Wishlist: backend database + localStorage fallback

**Guest Users:**
- Products: localStorage with 15-min TTL
- Cart: localStorage fallback
- Orders: cannot create
- Wishlist: cannot save

---

## Key Files to Know

### Backend Critical Files
- `backend/src/Utils/JWT.php` - JWT token generation/validation
- `backend/src/Http/AuthMiddleware.php` - Authentication check
- `backend/src/Controllers/*Controller.php` - API endpoints
- `backend/src/Models/*Model.php` - Database operations
- `backend/public/index.php` - Route definitions

### Frontend Critical Files
- `frontend/src/lib/api.js` - Auto-injects JWT token
- `frontend/src/models/UserModel.js` - Authentication
- `frontend/src/models/CartModel.js` - Cart operations
- `frontend/src/controllers/CartController.js` - Hybrid pattern
- `frontend/src/controllers/AuthController.js` - Auth wrapper

---

## Debugging Tips

### JWT Token Issues
```javascript
// Check if token exists in frontend
localStorage.getItem('rb_token_v1')

// Check token expiration (decode it)
const parts = token.split('.')
const payload = JSON.parse(atob(parts[1]))
console.log(new Date(payload.exp * 1000))
```

### API Not Working
1. Check `VITE_API_BASE` is correct
2. Verify backend is running on port 8000
3. Check CORS is enabled (should be * in dev)
4. Verify Authorization header is being sent
5. Check JWT_SECRET is initialized

### Database Connection Issues
```php
// Test connection
$pdo = Database::pdo();
echo "Connected!";
```

### Cart Not Saving
- If authenticated: check backend cart operations
- If guest: verify rb_cart_local in localStorage
- Check for JavaScript console errors

---

## Common Tasks

### Add a New API Endpoint

1. Create controller method
2. Add route in `backend/public/index.php`
3. Use AuthMiddleware::requireAuth() for protected endpoints
4. Call from frontend via api.js

Example:
```php
// In CartController.php
public function newMethod(Request $req): void {
    $payload = AuthMiddleware::requireAuth();
    if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

    // Your logic here
    Response::json(['success' => true]);
}
```

### Change JWT Expiration

Edit `backend/src/Utils/JWT.php`:
```php
// Default is 86400 (24 hours)
// Change the second parameter when calling encode()
JWT::encode($payload, 2592000) // 30 days
```

### Change Product Cache TTL

Edit `frontend/src/models/ProductModel.js`:
```javascript
// Default is 15 minutes (15 * 60 * 1000)
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
```

### Add New Product Fields

1. Update `schema.mysql.sql` with new column
2. Update ProductModel to fetch field
3. Update ProductController response
4. Update frontend views to display field

---

## Performance Tips

1. **Product Caching**: TTL prevents unnecessary backend calls
2. **Lazy Loading**: Load cart/orders only when needed
3. **Parallel Requests**: Use Promise.all() for independent requests
4. **Database Indexes**: Already configured for common queries
5. **Error Handling**: Don't lose user input on API failure

---

## Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Set CORS_ORIGIN to your domain (not *)
- [ ] Set APP_DEBUG=false in production
- [ ] Use HTTPS (recommend)
- [ ] Secure database credentials
- [ ] Monitor error logs for attacks
- [ ] Rate limit authentication endpoints
- [ ] Validate all user input

---

## Troubleshooting

### "Unauthorized" Error
- Token expired → User needs to login again
- Token missing → Check rb_token_v1 in localStorage
- Invalid token → Clear localStorage and login again

### "Product Not Found" Error
- Check if product_id is correct
- Verify product exists in database
- Check product hasn't been deleted

### "Item Not in Cart" Error
- Item was removed by another request
- Refresh cart to see current state
- Verify cart_id and item_id are correct

### Cart Not Syncing Between Tabs
- This is expected behavior (design choice)
- Each tab has independent state
- Backend is source of truth
- Refresh page to sync

### Products Show as Sample Data
- Cache has expired (15 minutes) → will refetch
- Backend is offline → cache fallback active
- Clear browser cache to force refresh
- Check VITE_API_BASE is correct

---

## Related Documents

- **MIGRATION_COMPLETE.md** - Full migration summary
- **INTEGRATION_VERIFICATION.md** - Detailed integration points
- **MIGRATION_TEST_GUIDE.md** - Comprehensive test scenarios

---

## Need Help?

1. Check the error message in browser console
2. Check backend logs (php -S shows errors)
3. Verify database connection works
4. Check JWT_SECRET is set
5. Review related documentation files
6. Check git history for recent changes

---

**Last Updated**: November 19, 2025
