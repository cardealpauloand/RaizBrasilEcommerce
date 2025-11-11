# Raiz Brasil — Frontend

This is a Vite + React frontend scaffold for the Raiz Brasil ecommerce (camisetas personalizadas). It's built with an MVC-style structure (models, controllers, views) and uses localStorage for persistence so you can run it without a backend.

Features implemented:
- Product listing, categories and search
- Product page
- Cart with add/update/remove, persisted to localStorage
- Checkout flow (simulated payment), creates orders and clears cart
- Profile/login/register (localStorage), default admin user (admin@raiz.com / admin123)
- Admin panel visible only to admins (shows orders)
- Responsive layout, green/yellow branding, animations

Notes:
- The app now serves assets from `../images` (workspace-level). Files there are publicly available at `/` (root). Example: `/LOgoRaizBrasilSemFundo.png`.
- Products already use your images (frente/costas). Update paths or add more in `src/models/ProductModel.js`.
- You can add a background image named `campo-hero.jpg` into the `images/` folder to replace the default hero backdrop reference (optional).

Run locally (Windows PowerShell):

```powershell
cd .\frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

Enjoy — ask me to add more features, polish animations, or connect to your backend.
