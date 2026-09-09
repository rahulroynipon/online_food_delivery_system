# ⚙️ BiteSpeed Backend API & WebSocket Server

Backend server for the **BiteSpeed Online Food Delivery Platform**, powering RESTful APIs, real-time WebSocket notifications, JWT authentication, and PostgreSQL database operations.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (ES Modules `import/export`)
- **Web Framework**: Express.js (`v4.19`)
- **Database**: PostgreSQL (`v8.12`)
- **ORM**: Sequelize ORM (`v6.37`)
- **Real-Time WebSockets**: `ws` (`v8.21`)
- **Authentication**: JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`) + Google OAuth (`google-auth-library`)
- **File Uploads**: `multer` + Cloudinary storage API (`cloudinary`)
- **Documentation**: Swagger UI (`swagger-ui-express` + `swagger-jsdoc`)
- **Email Notifications**: Nodemailer

---

## 📂 Backend Architecture

```
backend/
├── src/
│   ├── config/               # App configuration (DB, Env, Swagger, Cloudinary)
│   │   ├── db.js             # Sequelize connection setup
│   │   ├── env.js            # Environment variable validation
│   │   └── swagger.js        # OpenAPI / Swagger specification
│   ├── controllers/          # API Route Controllers
│   │   ├── authController.js # Signup, Login, OAuth, OTP verification
│   │   ├── orderController.js# Order placement, status updates, live tracking
│   │   ├── foodController.js # Food item CRUD, variants, add-ons
│   │   ├── adminController.js# Platform stats, merchant/rider approvals
│   │   ├── riderController.js# Delivery assignments, location pings, wallet
│   │   └── ...
│   ├── enums/                # Centralized Enums (UserRole, OrderStatus, etc.)
│   ├── middleware/           # Auth guard, Role verification, Error handler
│   ├── models/               # Sequelize Data Models
│   │   ├── User.js           # Platform users (Customers, Merchants, Riders, Admins)
│   │   ├── Restaurant.js     # Merchant store profiles
│   │   ├── FoodItem.js       # Menu items
│   │   ├── Variant.js        # Size/portion options
│   │   ├── Addon.js          # Extras & add-on groups
│   │   ├── Order.js          # Customer orders
│   │   ├── OrderItem.js      # Individual items in order
│   │   ├── DeliveryZone.js   # Geographical service zones
│   │   └── ...
│   ├── routes/               # Express Route Definitions
│   ├── seeddata/             # Automated Database Seeder
│   │   ├── seed.js           # Main seed script
│   │   └── restaurants.js    # 30 pre-configured restaurants & menus
│   ├── utils/                # Utility helpers (Hash, Token, Email, Cloudinary)
│   ├── websocket/            # WebSocket Server & Client Broadcast Hub
│   │   └── index.js          # WS connection lifecycle & event handlers
│   ├── app.js                # Express app setup & global middlewares
│   └── server.js             # HTTP/WS server launcher
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in `backend/.env`:

```env
# Server Config
PORT=5000
NODE_ENV=development

# Database Config (PostgreSQL connection string)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/online_food_delivery

# JWT Security
JWT_SECRET=bitespeed_jwt_super_secret_key_2026
JWT_EXPIRE=30d

# Cloudinary (Optional - defaults to local disk fallback if unconfigured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Config (Optional - SMTP for OTP sending)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🗄️ Database Seeding

Run the seeder to reset database tables and generate **30 premium restaurants** complete with categories, food items, size variants, add-ons, zones, and demo showcase accounts:

```bash
npm run seed
```

### Seeded Showcase Accounts (Password for all: `123456`)
1. **Admin**: `bitespeed@demo.com`
2. **Customer**: `customer@demo.com`
3. **Rider**: `rider@demo.com`
4. **Merchant**: `merchant@demo.com` *(Burger Legend)*
5. **Additional Merchants**: `merchant2@demo.com` through `merchant30@demo.com`

---

## 📡 API Endpoint Overview

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/signup` — Register customer account
- `POST /api/v1/auth/login` — Sign in with email & password
- `POST /api/v1/auth/google` — Google OAuth single sign-on
- `POST /api/v1/auth/forgot-password` — Request password reset link
- `POST /api/v1/auth/verify-otp` — Verify OTP code

### 🍕 Public Endpoints (`/api/v1/public`)
- `GET /api/v1/public/restaurants` — List restaurants (filtered by zone/category)
- `GET /api/v1/public/restaurants/:slug` — Get restaurant menu & details
- `GET /api/v1/public/restaurants/foods/popular` — Fetch top-rated dishes in zone
- `GET /api/v1/platform-categories` — Fetch platform food categories
- `GET /api/v1/delivery-zones` — Fetch delivery zones

### 🛍️ Customer Orders (`/api/v1/orders`)
- `POST /api/v1/orders` — Place a new food delivery order
- `GET /api/v1/orders/my-orders` — List current user's order history
- `GET /api/v1/orders/:id` — Fetch detailed order invoice & live tracking status
- `POST /api/v1/orders/:id/cancel` — Cancel pending order

### 🏪 Merchant Management (`/api/v1/restaurant`)
- `GET /api/v1/restaurant/orders` — Fetch incoming & active restaurant orders
- `PATCH /api/v1/restaurant/orders/:id/status` — Accept, prepare, or ready order
- `GET /api/v1/restaurant/foods` — List merchant menu items
- `POST /api/v1/restaurant/foods` — Create food item with variants & add-ons
- `PATCH /api/v1/restaurant/status` — Toggle restaurant open/close status

### 🚴 Rider Fleet (`/api/v1/rider`)
- `GET /api/v1/rider/available-orders` — List unclaimed orders in rider zone
- `POST /api/v1/rider/orders/:id/accept` — Accept delivery task
- `PATCH /api/v1/rider/orders/:id/status` — Update status (`PICKED_UP`, `DELIVERED`)
- `POST /api/v1/rider/location` — Broadcast current GPS coordinates

### 🛡️ Admin Panel (`/api/v1/admin`)
- `GET /api/v1/admin/stats` — Overall platform GMV & analytics
- `GET /api/v1/users` — Manage platform user accounts
- `PATCH /api/v1/admin/restaurants/:id/status` — Approve or suspend merchant
- `GET /api/v1/admin/withdrawals` — Process merchant & rider payout requests

---

## ⚡ WebSockets Protocol (`/ws`)

The backend runs a WebSocket server alongside HTTP on the same port (`ws://localhost:5000/ws`).

### Key Real-time Events:
- **`JOIN_ORDER_ROOM`**: Subscribes client to live tracking updates for a specific order.
- **`ORDER_STATUS_UPDATE`**: Broadcasts status transitions (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`).
- **`RIDER_LOCATION_UPDATE`**: Broadcasts live rider latitude/longitude coordinates to the customer map.
- **`NEW_ORDER_NOTIFICATION`**: Alerts merchant when a customer places an order.

---

## 📖 Swagger API Documentation

Interactive Swagger documentation is auto-generated and available when the server is running:

👉 **URL**: `http://localhost:5000/api-docs`

---

## 📜 Available Scripts

- `npm run dev` — Launch server in development mode with `nodemon` auto-reload
- `npm start` — Run production server
- `npm run seed` — Seed PostgreSQL database with demo dataset
- `npm run format` — Code formatting with Prettier
