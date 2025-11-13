# Raiz Brasil Ecommerce – Backend (PHP)

Backend PHP simples com MySQL, pronto para servir endpoints REST para o frontend.

## Requisitos
- PHP 8.1+
- Composer (opcional, recomendado)
- MySQL/MariaDB
- DBeaver (para gerenciar o banco)

## Estrutura
```
backend/
  public/
    index.php         # front controller (php -S 0.0.0.0:8000 -t public)
  src/
    bootstrap.php     # CORS, env, autoload simplificado
    Config/
      Env.php         # loader de variáveis (.env ou Dotenv)
      Database.php    # conexão PDO (MySQL)
    Http/
      Router.php      # roteador mínimo (GET/POST/...)
      Request.php     # parser de request
      Response.php    # resposta JSON
    Controllers/
      HealthController.php
      ProductController.php
      AuthController.php
      OrderController.php
    Models/
      BaseModel.php
      ProductModel.php
      UserModel.php
      OrderModel.php
  sql/
    schema.mysql.sql  # DDL de todas as tabelas
    seed.mysql.sql    # dados de exemplo
  .env.example        # exemplo de variáveis
  composer.json
```

## Variáveis de ambiente (.env)
Copie `.env.example` para `.env` e ajuste:
```
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=raiz_brasil
DB_USERNAME=root
DB_PASSWORD=your_password

CORS_ORIGIN=http://localhost:5173
```

## Instalação (Windows PowerShell)
1) Instale PHP e MySQL. Se preferir XAMPP/WAMP, também funciona.
2) (Opcional) Instale composer e as dependências:
```powershell
cd backend
composer install
```
3) Crie o banco e rode o schema + seed no MySQL (veja DBeaver abaixo).
4) Suba o servidor embutido do PHP:
```powershell
php -S localhost:8000 -t public
```

## DBeaver: conectar e criar tabelas
1) Abra o DBeaver e crie uma nova conexão MySQL.
   - Host: 127.0.0.1
   - Port: 3306
   - Database: (crie depois)
   - User: root (ou o seu usuário)
   - Password: sua_senha
2) Conecte, clique com direito no servidor e crie um novo banco chamado `raiz_brasil`.
3) Abra um editor SQL (right-click no DB → SQL Editor → New Script) e rode:
   - `backend/sql/schema.mysql.sql`
   - `backend/sql/seed.mysql.sql`
4) Atualize `.env` com as credenciais do seu MySQL.

## Endpoints iniciais
- GET `http://localhost:8000/api/health` → { status: "ok" }
- GET `http://localhost:8000/api/products` → lista produtos (+ imagem principal)
- GET `http://localhost:8000/api/products/{id}` → detalhe do produto
- POST `http://localhost:8000/api/register` → { name, email, password }
- POST `http://localhost:8000/api/login` → { email, password }
- POST `http://localhost:8000/api/orders` → cria pedido

Exemplo de body de pedido (JSON):
```json
{
  "user_id": 1,
  "items": [
    {"productId": 1, "title": "Camiseta X", "price": 139.9, "qty": 2, "size": "M"}
  ],
  "subtotal": 279.8,
  "shippingCost": 0,
  "total": 279.8,
  "payment": { "method": "pix" },
  "shipping": {
    "name":"Cliente",
    "phone":"11999999999",
    "street":"Rua das Flores",
    "number":"123",
    "complement":"Casa B",
    "city":"São Paulo",
    "state":"SP",
    "cep":"01001000"
  }
}
```
Regras:
- `cartao` → status inicial `pago`
- `pix`/`boleto` → status inicial `aguardando`

## Integração com o frontend
- Em desenvolvimento, o frontend (Vite) roda em `http://localhost:5173`.
- Este backend habilita CORS (configurável via `CORS_ORIGIN`).
- O frontend atual usa localStorage; você pode migrar gradualmente para a API acima (ex.: produtos/checkout) mantendo compatibilidade.

## Notas
- Segurança (JWT, senhas, CSRF, validação robusta) foi simplificada para dev.
- Em produção, use servidor web (Nginx/Apache), HTTPS e variáveis de ambiente seguras.
