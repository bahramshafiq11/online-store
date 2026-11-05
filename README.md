# MyStore

A full stack e-commerce store built with the **MERN stack** (MongoDB, Express, React, Node.js). Customers can browse, search, review, and buy products with Cash on Delivery or online card payments, and admins manage products and orders from a built-in dashboard.

**Live demo:** _coming soon_

![MyStore home page](docs/screenshots/home.png)

---

## Features

### For customers
- **Browse products** with search, category filters, and pagination
- **Product pages** with descriptions, stock levels, and star ratings
- **Shopping cart** that survives a page refresh
- **Accounts:** register, log in, and log out, with secure hashed passwords
- **Checkout** with Cash on Delivery or **online card payment** (Safepay, test mode)
- **Order tracking:** order history, status updates, and order details
- **Cancel orders** while they're still pending (stock is returned automatically)
- **Reviews:** 1 to 5 star ratings and comments, only for products you've actually bought
- **Email notifications** for order confirmation, payment, shipping, delivery, and cancellation

### For admins
- **Product management:** add, edit, and delete products
- **Image uploads** straight from your computer (stored on Cloudinary)
- **Order management:** view all orders and update their status
- **Payment overview:** see which orders are paid, unpaid, or Cash on Delivery
- **Review moderation:** delete any review

### Under the hood
- JWT authentication with automatic logout when a session expires
- Role-based access: admin routes are protected on the server, not just hidden in the UI
- Prices are always read from the database at checkout, so they can't be tampered with in the browser
- Stock is reduced on order, restored on cancellation, and checked before un-cancelling
- Online payments are confirmed server-to-server with Safepay, with amount, currency, and merchant checks
- Clear JSON error messages from a central error handler
- An automated API test script covering 60+ checks

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, React Router, Axios, plain CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas with Mongoose |
| Auth | JSON Web Tokens (JWT), bcrypt password hashing |
| Images | Cloudinary, Multer |
| Payments | Safepay (sandbox) |
| Email | Nodemailer (Ethereal test inbox or any SMTP provider) |

---

## Screenshots

| Home | Product |
|---|---|
| ![Home](docs/screenshots/home.png) | ![Product](docs/screenshots/product.png) |

| Cart | Admin dashboard |
|---|---|
| ![Cart](docs/screenshots/cart.png) | ![Admin](docs/screenshots/admin.png) |

---

## Project structure

```
online-store
├── client                  React frontend (Vite)
│   └── src
│       ├── components      Navbar, Footer, Rating, Pagination, route guards
│       ├── context         AuthContext (login state), CartContext (cart state)
│       ├── pages           Home, Product, Cart, Checkout, Orders, Login, Register
│       │   └── admin       Admin products, product form, admin orders
│       ├── api.js          Axios instance (adds the login token, handles expiry)
│       └── index.css       All styles, with design tokens at the top
│
└── server                  Express backend
    ├── middleware          protect (logged in) and admin checks
    ├── models              User, Product (with reviews), Order
    ├── routes              products, users, orders, upload, payments
    ├── utils               email sending and templates, Safepay helpers
    ├── server.js           App setup and error handler
    ├── makeAdmin.js        Make a user an admin
    ├── setPassword.js      Change a user's password
    ├── seedProducts.js     Add or remove 12 sample products
    └── test-api.ps1        Automated API tests (PowerShell)
```

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org) (LTS version)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) database
- Optional: free [Cloudinary](https://cloudinary.com) account (image uploads)
- Optional: [Safepay](https://getsafepay.com) sandbox account (online payments)

### 1. Clone the project

```bash
git clone https://github.com/bahramshafiq11/online-store.git
cd online-store
```

### 2. Set up the backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and fill in your values (see [Environment variables](#environment-variables)).

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Set up the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

The store runs at `http://localhost:5173`.

### 4. Add sample products and an admin

```bash
cd server
node seedProducts.js
```

Register an account on the website, then make it an admin:

```bash
node makeAdmin.js you@example.com
```

Log out and back in to see the **Admin** link.

---

## Environment variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random string used to sign login tokens |
| `CLIENT_URL` | Yes | Frontend address, used in email links and payment redirects |
| `SERVER_URL` | Yes | Backend address, used for payment redirects |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For uploads | Cloudinary API secret |
| `SAFEPAY_ENV` | For payments | `sandbox` or `production` |
| `SAFEPAY_PUBLIC_KEY` | For payments | Safepay API key (starts with `sec_`) |
| `SAFEPAY_SECRET_KEY` | For payments | Safepay secret key |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | No | Real email delivery. Without these, emails go to a free [Ethereal](https://ethereal.email) test inbox and a preview link is printed in the terminal |

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### `client/.env` (optional)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API address. Defaults to `http://localhost:5000/api` |

If Cloudinary or Safepay keys are missing, the store still works: image uploads return an error, and the online payment option is hidden at checkout.

---

## Testing payments

Online payments use the **Safepay sandbox**, so no real money moves.

1. Choose **Pay online** at checkout.
2. On Safepay's page, use their published dummy card: `5200 0000 0000 1096`, expiry `03/28`, CVC `111`.
3. In the bank verification step, enter the OTP shown on screen (`1234`).
4. Open the order in **My Orders**. The store checks the payment with Safepay and marks it **Paid**.

How it works: the backend creates a Safepay tracker for the order total, sends the customer to Safepay's hosted payment page (card details never touch this server), and then confirms the payment by asking Safepay directly. An order is only marked paid when Safepay reports the payment as complete, for the right amount and currency, on this store's own merchant account.

---

## API overview

All endpoints start with `/api`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products?search=&category=&page=&limit=` | Public | List products |
| GET | `/products/categories` | Public | List categories |
| GET | `/products/:id` | Public | Get one product with reviews |
| POST | `/products` | Admin | Create a product |
| PUT | `/products/:id` | Admin | Update a product |
| DELETE | `/products/:id` | Admin | Delete a product |
| POST | `/products/:id/reviews` | Buyers | Add a review |
| DELETE | `/products/:id/reviews/:reviewId` | Reviewer or admin | Delete a review |
| POST | `/users/register` | Public | Create an account |
| POST | `/users/login` | Public | Log in and get a token |
| GET | `/users/profile` | Logged in | Get your profile |
| POST | `/orders` | Logged in | Place an order |
| GET | `/orders/mine` | Logged in | Your orders |
| GET | `/orders/:id` | Owner or admin | One order |
| PUT | `/orders/:id/cancel` | Owner | Cancel a pending, unpaid order |
| GET | `/orders` | Admin | All orders |
| PUT | `/orders/:id/status` | Admin | Update order status |
| POST | `/upload` | Admin | Upload a product image |
| GET | `/payments/config` | Public | Whether online payment is available |
| POST | `/payments/:orderId/start` | Owner | Start a Safepay payment |
| POST | `/payments/:orderId/verify` | Owner or admin | Confirm a payment with Safepay |

Protected endpoints need the header `Authorization: Bearer <token>`.

---

## Running the API tests

With the backend running, from the `server` folder in PowerShell:

```powershell
$env:ADMIN_EMAIL = "your-admin@example.com"
$env:ADMIN_PASSWORD = "your-admin-password"
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

The script checks products, search, pagination, registration, login, admin protection, uploads, orders, stock changes, cancellations, reviews, and payment rules, printing **PASS** or **FAIL** for each. It creates and deletes its own test product.

---

## Useful scripts

Run these from the `server` folder:

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with auto-restart |
| `npm start` | Start the API (production) |
| `node seedProducts.js` | Add 12 sample products |
| `node seedProducts.js --remove` | Remove the sample products |
| `node makeAdmin.js email` | Make a user an admin |
| `node setPassword.js email newpassword` | Change a user's password |

---

## Deployment

- **Backend:** [Render](https://render.com) web service. Root directory `server`, build command `npm install`, start command `npm start`, plus all variables from `server/.env`.
- **Frontend:** [Vercel](https://vercel.com). Root directory `client`, with `VITE_API_URL` set to your Render URL plus `/api`. The included `vercel.json` makes page refreshes work on every route.
- In MongoDB Atlas, allow network access from your host.
- After deploying, set `CLIENT_URL` and `SERVER_URL` on the backend to the live addresses.

---

## Possible improvements

- Online refunds for cancelled paid orders
- Wishlist and product variants (sizes, colors)
- Discount codes
- Sorting by price and rating
- Admin sales dashboard with charts
- Unit and end-to-end tests in JavaScript

---

## Author

**Bahram Shafiq**
GitHub: [@bahramshafiq11](https://github.com/bahramshafiq11)

If you found this project useful, consider giving it a star.