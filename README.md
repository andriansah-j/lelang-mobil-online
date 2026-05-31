# Lelang Online - Full-Stack Car Auction System

Lelang Online is a high-fidelity full-stack Car Auction application built with **React**, **Vite**, **Node.js (Express + WebSockets)**, and a **PostgreSQL** database. 

It implements all functional requirements outlined in the CAReady Auction System FSD, including multi-role portals (Admin, Seller, Inspector, Conductor, and Buyer) with real-time bidding synchronization.

---

## 🛠️ Architecture

```
                                +---------------------------+
                                |  React (Vite) Frontend    |
                                |  (Port 5173 / Mobile)     |
                                +-------------+-------------+
                                              |
                                              | HTTP API / WS
                                              v
                                +-------------+-------------+
                                |    Express & WS Server    |
                                |        (Port 5000)        |
                                +-------------+-------------+
                                              |
                                              | pg Client
                                              v
                                +-------------+-------------+
                                |    PostgreSQL Database    |
                                |          (lelang)         |
                                +---------------------------+
```

* **Frontend**: React SPA styled with pure CSS (Glassmorphic obsidian look). Exposes local IP network address for mobile access.
* **Backend**: Express REST API + WebSocket Server on port `5000` to manage PostgreSQL interactions and broadcast real-time lot bidding states.
* **Database**: PostgreSQL storing system data for users, cars, inspections, live bids, and NIPL transactions.

---

## 🚀 Getting Started

Follow these steps to run the full-stack application on your machine:

### 1. Database Setup (PostgreSQL)
Ensure your PostgreSQL server is active, and that you have a database named `lelang`.
Then run the setup utility to automatically create the table structures and pre-seed initial records:
```bash
# 1. Install PostgreSQL node drivers
npm install pg

# 2. Run the database configuration script
node setup_db.cjs
```
*Note: The script utilizes connection credentials: `database: lelang`, `password: rahasia123`, `user: postgres`.*

### 2. Start the Backend API & WebSocket Server
Start the Express application:
```bash
node server.js
```
*The server will start listening on port `5000` and confirm connection to your PostgreSQL database.*

### 3. Start the Frontend Application
In a separate terminal, run the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Mobile Device Connection
Vite is configured to listen on all interfaces. You can access the application from a mobile device connected to the same Wi-Fi network:
* Open the mobile browser and visit: **`http://192.168.1.199:5173/`**
* *If the page hangs, ensure port `5173` is allowed through your Windows Defender Firewall.*

---

## 🔑 Demo Accounts
The database is pre-seeded with the following roles (password for all accounts is `password` or their respective role names):
* **Super Admin**: `admin@lelangonline.com` (pw: `password`)
* **Inspector Admin**: `inspector@lelangonline.com` (pw: `password` / `inspector admin`)
* **Conductor Admin**: `conductor@lelangonline.com` (pw: `password` / `conductor admin`)
* **Seller Account**: `seller@lelangonline.com` (pw: `password`)
* **Buyer (Budi Sukarjan)**: `buyer@lelangonline.com` (pw: `password`)
