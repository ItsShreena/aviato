# ✈️ AVIATO — Flight Booking Platform

AVIATO is a full-stack flight booking platform designed to simulate a modern airline reservation experience. It combines flight search, authentication, seat selection, real-time seat availability, booking management, PNR generation, email confirmations, and downloadable boarding passes into a single application.

The project is built with React, TypeScript, Express, PostgreSQL, Prisma, WebSockets, and the LetsFG Sandbox flight API.

> **Note:** AVIATO currently uses the LetsFG Sandbox environment for flight search and simulated booking. It is a demonstration/project application and does not issue real airline tickets or process live airline reservations.

---

## 🌐 Live Project

**GitHub:**  
https://github.com/ItsShreena/aviato

---

## ✨ Features

### 🔐 Authentication & User Management
- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Customer and admin roles
- User profile management
- Passport information support

### ✈️ Flight Search
- Search flights by origin and destination
- Date-based flight search
- Cabin class selection
- Passenger count support
- Flight filtering and sorting
- Flight duration and stop information
- Dynamic flight pricing
- LetsFG Sandbox flight data integration
- Demo flight provider fallback

### 💺 Seat Selection
- Interactive aircraft seat map
- Multiple cabin classes
- Seat availability tracking
- Seat selection during booking
- Prevention of conflicting seat selections

### ⚡ Real-Time Seat Availability
AVIATO uses WebSockets to synchronize seat availability between connected users.

When a seat is selected or locked, other active users can receive the updated availability without refreshing the page.

### 🎫 Booking System
- Passenger information collection
- Seat assignment
- Booking confirmation
- Unique booking/PNR number generation
- Booking history
- Booking status tracking
- Booking details dashboard

### 📧 Email Confirmation
Transactional emails can be sent after booking using Resend.

### 🪪 Boarding Pass
AVIATO can generate a downloadable boarding pass containing:

- Passenger details
- Flight information
- Seat number
- Booking/PNR information
- Travel details

### 👨‍💼 Admin Features
Admin functionality includes access to management-oriented flight and booking information.

### 🗄️ Database
The backend uses PostgreSQL with Prisma ORM for:

- Users
- Flights
- Airports
- Aircraft
- Bookings
- Relationships and indexes

---

# 🛠️ Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

## Backend

- Node.js
- Express.js
- TypeScript
- WebSockets
- JWT
- bcryptjs

## Database

- PostgreSQL
- Prisma ORM

## Integrations

- LetsFG Sandbox — flight search
- Resend — transactional email
- Razorpay SDK — payment integration scaffolding
- PDFKit — boarding pass generation

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │  TypeScript + Vite  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Express Server   │
                    │     REST APIs       │
                    └──────┬───────┬──────┘
                           │       │
              ┌────────────┘       └──────────────┐
              ▼                                   ▼
     ┌─────────────────┐                  ┌─────────────────┐
     │    PostgreSQL   │                  │    WebSocket    │
     │     + Prisma    │                  │ Realtime Seats  │
     └─────────────────┘                  └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │   External APIs  │
     │    LetsFG        │
     │    Resend         │
     └─────────────────┘
