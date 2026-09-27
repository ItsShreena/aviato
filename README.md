# ✈️ AVIATO

### Fly Smarter. Reach Faster.

AVIATO is a full-stack flight booking and reservation platform built as a portfolio and engineering project. It demonstrates a modern flight-search and reservation workflow across a React/TypeScript frontend, Express/Node.js backend, Prisma/PostgreSQL persistence, external flight-provider integration, real-time seat synchronization, authentication and role-based authorization, booking management, transactional email, and PDF boarding-pass generation.

> **Important:** AVIATO is a portfolio/educational reservation simulator. It is not a real airline ticketing system and does not process real-world flight reservations.

---

## 📌 Table of Contents

* [About AVIATO](#about-aviato)
* [Project Goal](#project-goal)
* [Problem Statement](#problem-statement)
* [Solution](#solution)
* [Key Features](#key-features)
* [User Journey](#user-journey)
* [System Architecture](#system-architecture)
* [Frontend Architecture](#frontend-architecture)
* [Backend Architecture](#backend-architecture)
* [Flight Search](#flight-search)
* [External Flight Provider Integration](#external-flight-provider-integration)
* [Flight Data Normalization](#flight-data-normalization)
* [Real-Time Seat Synchronization](#real-time-seat-synchronization)
* [Seat Management](#seat-management)
* [Authentication](#authentication)
* [Authorization](#authorization)
* [Booking System](#booking-system)
* [PNR Generation](#pnr-generation)
* [Email Confirmation](#email-confirmation)
* [Boarding Pass Generation](#boarding-pass-generation)
* [User Dashboard](#user-dashboard)
* [Admin Dashboard](#admin-dashboard)
* [Database Design](#database-design)
* [REST API](#rest-api)
* [WebSocket API](#websocket-api)
* [Failure Handling](#failure-handling)
* [Security](#security)
* [Engineering Challenges](#engineering-challenges)
* [Important Technical Decisions](#important-technical-decisions)
* [Technology Stack](#technology-stack)
* [Project Structure](#project-structure)
* [Environment Variables](#environment-variables)
* [Installation & Setup](#installation--setup)
* [Available Scripts](#available-scripts)
* [Testing](#testing)
* [Current Project Status](#current-project-status)
* [Future Scope](#future-scope)
* [Scalability Considerations](#scalability-considerations)
* [Engineering Concepts Demonstrated](#engineering-concepts-demonstrated)
* [Screenshots](#screenshots)
* [Documentation](#documentation)
* [Author](#author)
* [Repository](#repository)
* [Security Notice](#security-notice)
* [Disclaimer](#disclaimer)

---

# About AVIATO

AVIATO is designed to simulate a complete flight-search and reservation experience while demonstrating practical full-stack engineering concepts.

The project focuses on building a realistic application rather than a simple CRUD interface.

The platform combines:

* Flight search
* External flight-provider integration
* Flight data normalization
* Seat selection
* Real-time seat synchronization
* User authentication
* Role-based authorization
* Booking management
* PNR generation
* Email confirmation
* PDF boarding-pass generation
* Customer dashboard
* Admin dashboard
* PostgreSQL persistence
* WebSocket communication
* API failure handling
* Authentication security

The architecture is intentionally modular so that individual services can be replaced or extended without rewriting the entire application.

---

# Project Goal

The primary goal of AVIATO is to demonstrate how a modern full-stack reservation platform can be designed and implemented.

The project focuses on:

1. Building a responsive React frontend.
2. Creating a REST API using Node.js and Express.
3. Persisting application data using PostgreSQL and Prisma.
4. Integrating an external flight-data provider.
5. Normalizing inconsistent external API responses.
6. Implementing authentication using JWT.
7. Implementing role-based authorization.
8. Building real-time seat synchronization using WebSockets.
9. Handling external API, database, email, and application failures gracefully.
10. Generating booking confirmations and boarding passes.
11. Designing a scalable application architecture.
12. Demonstrating practical software engineering decisions.

---

# Problem Statement

Flight-booking applications involve more than simply displaying a list of flights.

A realistic reservation workflow needs to handle:

### Flight Search

Users should be able to search for flights using:

* Origin
* Destination
* Departure date
* Passenger count

### External Data

Flight information may come from external providers and can contain inconsistent structures.

The application therefore needs to normalize provider responses before displaying them.

### Seat Selection

Users need to:

* View available seats
* Select seats
* See unavailable seats
* Prevent conflicting reservations

### Booking

A booking system needs to maintain:

* Passenger information
* Flight information
* Seat information
* Booking status
* PNR
* User association

### Authentication

Users need secure account management and protected booking data.

### Real-Time Synchronization

When multiple users interact with the same flight, seat availability should remain synchronized.

### Reliability

External services may fail.

The application therefore needs fallback behavior and error handling instead of simply crashing.

---

# Solution

AVIATO solves these problems through a layered full-stack architecture.

```text
React Frontend
      │
      ▼
Express REST API
      │
      ├── Authentication
      ├── Flight Search
      ├── Seat Management
      ├── Booking Management
      ├── Email Service
      └── Boarding Pass Generator
      │
      ▼
Prisma ORM
      │
      ▼
PostgreSQL Database
```

External flight information is retrieved through a provider integration and normalized before being consumed by the frontend.

Real-time seat updates are handled independently through WebSockets.

---

# Key Features

## ✈️ Flight Search

Users can search flights using:

* Origin
* Destination
* Departure date
* Passenger count

The system supports external flight-provider data as well as fallback/demo data.

---

## 🔄 Flight Data Normalization

External flight-provider responses are converted into a consistent internal format.

This prevents frontend components from depending directly on provider-specific structures.

---

## 💺 Interactive Seat Selection

Users can:

* View the aircraft seat map
* Select available seats
* See occupied seats
* Remove selected seats
* Continue with the booking

---

## ⚡ Real-Time Seat Synchronization

WebSockets are used to synchronize seat availability between connected clients.

When a seat changes state, connected clients can receive the update without refreshing the page.

---

## 🔐 Authentication

The platform supports:

* User registration
* Login
* Password hashing
* JWT authentication
* Protected routes
* Session persistence

Passwords are hashed using `bcryptjs`.

---

## 👥 Role-Based Authorization

The application supports different user roles.

### Customer

Customers can:

* Search flights
* Select seats
* Create bookings
* View bookings
* Download boarding passes

### Admin

Admins can access administrative functionality such as:

* Viewing users
* Viewing bookings
* Managing application data

---

## 🎫 Booking Management

Users can create bookings containing:

* Flight information
* Passenger information
* Selected seats
* Booking status
* PNR
* User information

Bookings are persisted using PostgreSQL through Prisma.

---

## 🔢 PNR Generation

Each booking receives a unique PNR identifier.

The PNR can be used to identify a reservation throughout the application.

---

## 📧 Email Confirmation

After a successful booking, the application can send confirmation emails using Resend.

Emails can contain:

* Booking information
* Flight details
* Passenger information
* PNR
* Seat information

---

## 📄 PDF Boarding Pass

AVIATO generates PDF boarding passes using PDFKit.

The boarding pass contains relevant reservation information such as:

* Passenger
* Flight
* Route
* Date
* Seat
* PNR

---

## 👤 User Dashboard

Authenticated users can view their:

* Profile
* Bookings
* Booking details
* PNRs
* Boarding passes

---

## 🛠️ Admin Dashboard

Administrators have access to management functionality for application data.

This provides a separate interface from the normal customer booking workflow.

---

# User Journey

The typical customer workflow is:

```text
Landing Page
     │
     ▼
Search Flights
     │
     ▼
View Results
     │
     ▼
Select Flight
     │
     ▼
Select Seats
     │
     ▼
Enter Passenger Details
     │
     ▼
Review Booking
     │
     ▼
Confirm Booking
     │
     ▼
Generate PNR
     │
     ├──────────────► Send Confirmation Email
     │
     └──────────────► Generate Boarding Pass
     │
     ▼
Booking Confirmation
```

---

# System Architecture

```text
                        ┌──────────────────────┐
                        │      React UI        │
                        │  React + TypeScript  │
                        └──────────┬───────────┘
                                   │
                          HTTP / REST API
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Express Backend    │
                        │      Node.js         │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       Authentication       Flight Service       Booking Service
              │                    │                    │
              │                    ▼                    │
              │             External Provider           │
              │                    │                    │
              │                    ▼                    │
              │             Data Normalization          │
              │                                         │
              └──────────────────┬──────────────────────┘
                                 │
                                 ▼
                        ┌──────────────────────┐
                        │       Prisma         │
                        │         ORM          │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │     PostgreSQL       │
                        └──────────────────────┘

                     WebSocket Connection
                              │
                              ▼
                     Real-Time Seat Updates
```

---

# Frontend Architecture

The frontend is built using:

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Motion
* Recharts

The UI is organized into reusable components and pages.

Frontend responsibilities include:

* Rendering flight search
* Displaying flight results
* Seat-map interaction
* Booking forms
* Authentication screens
* Dashboards
* Booking confirmation
* Boarding-pass access
* Responsive layouts

---

# Backend Architecture

The backend uses:

* Node.js
* Express
* Prisma
* PostgreSQL
* WebSockets
* JWT
* bcryptjs
* Resend
* PDFKit

The backend is responsible for:

* Authentication
* Authorization
* Flight search
* Flight normalization
* Seat management
* Booking creation
* Booking retrieval
* PNR generation
* Email delivery
* Boarding-pass generation
* Database operations
* WebSocket communication

---

# Flight Search

Flight search accepts parameters such as:

```text
Origin
Destination
Departure Date
Passengers
```

Example:

```text
DEL → BOM
Departure: 2026-10-10
Passengers: 2
```

The backend communicates with the external flight provider and converts the response into the application's internal flight representation.

---

# External Flight Provider Integration

AVIATO integrates with the LetsFG flight-data provider.

The provider is responsible for supplying flight information.

The backend acts as an abstraction layer between the provider and the frontend.

```text
Frontend
   │
   ▼
AVIATO API
   │
   ▼
Flight Provider
   │
   ▼
Raw Flight Data
   │
   ▼
Normalizer
   │
   ▼
AVIATO Flight Model
   │
   ▼
Frontend
```

This approach prevents provider-specific implementation details from leaking into the UI.

---

# Flight Data Normalization

External APIs can return data in structures that differ from the application's requirements.

AVIATO therefore uses a normalization layer.

For example, an external provider might return:

```json
{
  "departure": {
    "iataCode": "DEL"
  },
  "arrival": {
    "iataCode": "BOM"
  }
}
```

The application can convert this into a predictable internal structure:

```json
{
  "origin": "DEL",
  "destination": "BOM"
}
```

The same concept is applied to:

* Airline information
* Flight numbers
* Departure times
* Arrival times
* Duration
* Prices
* Aircraft information

This makes the frontend independent of the external provider's response format.

---

# Real-Time Seat Synchronization

Seat availability is synchronized using WebSockets.

```text
Client A
   │
   │ Seat Update
   ▼
WebSocket Server
   │
   ├──────────────► Client B
   │
   ├──────────────► Client C
   │
   └──────────────► Client D
```

When a seat becomes unavailable, connected clients can receive the update immediately.

This reduces the possibility of users viewing outdated seat information.

---

# Seat Management

The seat-management system tracks:

* Available seats
* Selected seats
* Reserved seats
* Seat status
* User interactions

The frontend displays a visual seat map.

Typical seat states include:

```text
Available
Selected
Occupied
```

Example:

```text
A1  A2  A3  A4
○   ○   X   ○

B1  B2  B3  B4
○   ●   ○   X
```

Where:

* `○` = Available
* `●` = Selected
* `X` = Occupied

---

# Authentication

AVIATO uses JWT-based authentication.

## Registration

Users provide account information during registration.

Passwords are hashed using `bcryptjs` before storage.

```text
Password
   │
   ▼
bcryptjs
   │
   ▼
Password Hash
   │
   ▼
Database
```

The original password is never stored directly.

---

## Login

During login:

```text
Email + Password
       │
       ▼
Find User
       │
       ▼
Compare Password
       │
       ▼
Generate JWT
       │
       ▼
Authenticated Session
```

---

# Authorization

Authentication determines **who the user is**.

Authorization determines **what the user is allowed to do**.

AVIATO uses role-based authorization.

Example:

```text
USER
 ├── Search Flights
 ├── Create Booking
 ├── View Own Bookings
 └── Download Boarding Pass

ADMIN
 ├── View Users
 ├── View Bookings
 └── Administrative Operations
```

Protected API routes validate the user's authentication token and role where required.

---

# Booking System

The booking workflow is:

```text
Select Flight
      │
      ▼
Select Seats
      │
      ▼
Enter Passenger Information
      │
      ▼
Validate Request
      │
      ▼
Create Booking
      │
      ▼
Generate PNR
      │
      ├────────────► Send Email
      │
      └────────────► Generate Boarding Pass
      │
      ▼
Return Confirmation
```

A booking contains information such as:

* User
* Flight
* Passenger
* Seats
* PNR
* Booking status
* Created timestamp

---

# PNR Generation

Each confirmed booking receives a unique PNR.

Example:

```text
PNR: AVT7K29X
```

The PNR is associated with the booking and can be displayed in the user's dashboard and confirmation email.

---

# Email Confirmation

Resend is used for transactional email delivery.

The confirmation email can include:

```text
AVIATO Booking Confirmation

Passenger: John Doe
Flight: AV123
Route: DEL → BOM
Date: 10 Oct 2026
Seat: 12A
PNR: AVT7K29X
```

The email service is separated from the main booking logic so that email failures can be handled independently.

---

# Boarding Pass Generation

PDFKit is used to generate boarding passes.

The generated document can include:

```text
--------------------------------
           AVIATO
        BOARDING PASS
--------------------------------

Passenger: John Doe

Flight:       AV123
From:         DEL
To:           BOM

Date:         10 Oct 2026
Seat:         12A

PNR:          AVT7K29X

--------------------------------
```

The boarding pass can be accessed from the booking interface.

---

# User Dashboard

Authenticated users can access their booking history.

The dashboard provides information such as:

* Upcoming bookings
* Previous bookings
* Flight details
* Passenger information
* Seat information
* PNR
* Boarding pass

---

# Admin Dashboard

The admin dashboard provides administrative visibility into application data.

Depending on the configured role, administrators can view:

* Users
* Bookings
* Booking details
* Application information

Administrative routes are protected using role-based authorization.

---

# Database Design

Prisma is used as the ORM layer.

PostgreSQL is used as the primary database.

The database contains entities representing application concepts such as:

```text
User
 │
 └── Booking
       │
       ├── Passenger Information
       ├── Flight Information
       ├── Seats
       └── PNR
```

A simplified booking model conceptually contains:

```text
Booking
├── id
├── userId
├── flightId
├── passenger information
├── seat information
├── PNR
├── status
└── createdAt
```

Prisma provides:

* Schema definition
* Type-safe database access
* Migrations
* Query abstraction

---

# REST API

The backend exposes REST endpoints for application functionality.

## Authentication

| Method | Endpoint             | Purpose                |
| ------ | -------------------- | ---------------------- |
| POST   | `/api/auth/register` | Register a user        |
| POST   | `/api/auth/login`    | Authenticate a user    |
| GET    | `/api/auth/me`       | Get authenticated user |

---

## Flights

| Method | Endpoint              | Purpose                |
| ------ | --------------------- | ---------------------- |
| GET    | `/api/flights/search` | Search flights         |
| GET    | `/api/flights/:id`    | Get flight information |

---

## Bookings

| Method | Endpoint                          | Purpose                       |
| ------ | --------------------------------- | ----------------------------- |
| POST   | `/api/book`                       | Create a booking              |
| GET    | `/api/bookings`                   | Get user bookings             |
| GET    | `/api/bookings/:id`               | Get booking details           |
| GET    | `/api/bookings/:id/boarding-pass` | Generate/access boarding pass |

---

## Admin

Administrative endpoints provide access to protected management operations.

All sensitive routes require appropriate authentication and authorization.

---

# WebSocket API

WebSockets are used for real-time seat updates.

Conceptually:

```text
Client
   │
   │ WebSocket Connection
   ▼
WebSocket Server
   │
   ├── Seat Selected
   ├── Seat Released
   └── Seat Reserved
```

Clients connected to the relevant flight can receive seat-state changes without polling the REST API repeatedly.

---

# Failure Handling

AVIATO is designed to handle failures at multiple levels.

## External API Failure

If the external flight provider is unavailable, the application can use fallback/demo flight data where supported.

---

## Database Failure

Database errors are caught and returned as appropriate API errors rather than exposing internal database details.

---

## Email Failure

Email delivery is treated separately from booking creation.

A temporary email failure should not unnecessarily invalidate an otherwise successful booking.

---

## WebSocket Failure

If the WebSocket connection is interrupted, the client can continue using normal application functionality and reconnect when possible.

---

## Invalid Requests

Backend validation prevents malformed requests from reaching sensitive application logic.

---

# Security

Security considerations include:

### Password Hashing

Passwords are hashed using `bcryptjs`.

### JWT Authentication

Protected resources require valid authentication tokens.

### Role-Based Authorization

Administrative functionality is restricted based on user roles.

### Environment Variables

Sensitive credentials are stored through environment variables rather than committed directly into source code.

### Input Validation

API inputs are validated before processing.

### Error Handling

Internal implementation details should not be unnecessarily exposed through API responses.

### CORS

Cross-origin access is configured for the application environment.

---

# Engineering Challenges

## 1. External API Normalization

Different external responses can have different structures.

A normalization layer was introduced to maintain a consistent internal representation.

---

## 2. Real-Time Seat Synchronization

Multiple clients may interact with the same flight simultaneously.

WebSockets were introduced to distribute seat-state changes between connected clients.

---

## 3. Booking Consistency

Seat selection and booking creation need to remain consistent with the current seat state.

Backend validation is therefore required instead of trusting only the frontend.

---

## 4. Authentication

The application needed secure user registration, login, password hashing, JWT handling, and protected routes.

---

## 5. External Service Reliability

Flight APIs and email providers can become unavailable.

Fallback mechanisms and isolated service handling help prevent one external dependency from breaking the entire application.

---

## 6. PDF Generation

Generating a usable boarding pass required transforming booking information into a structured PDF document.

---

# Important Technical Decisions

## React + TypeScript

TypeScript provides static typing while React provides component-based UI development.

---

## Express

Express provides a lightweight framework for building the REST API.

---

## Prisma

Prisma provides type-safe database access and simplifies interaction with PostgreSQL.

---

## PostgreSQL

PostgreSQL provides persistent relational storage for users, bookings, and related application data.

---

## WebSockets

WebSockets were selected because seat synchronization benefits from real-time bidirectional communication.

---

## JWT

JWT provides a stateless authentication mechanism for API requests.

---

## Resend

Resend provides transactional email delivery.

---

## PDFKit

PDFKit allows boarding passes to be generated programmatically.

---

# Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Motion
* Recharts

## Backend

* Node.js
* Express
* TypeScript
* WebSockets

## Database

* PostgreSQL
* Prisma

## Authentication

* JWT
* bcryptjs

## External Services

* LetsFG flight provider
* Resend

## Document Generation

* PDFKit

## Development Tools

* dotenv
* esbuild
* npm/pnpm

---

# Project Structure

A simplified project structure is:

```text
AVIATO/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ...
│   │
│   └── ...
│
├── server/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── ...
│
├── prisma/
│   ├── schema.prisma
│   └── ...
│
├── public/
│
├── package.json
├── .env
└── README.md
```

The exact structure may vary depending on the current implementation.

---

# Environment Variables

Create a `.env` file containing the required configuration.

Example:

```env
DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_jwt_secret

LETSFG_API_KEY=your_flight_provider_key

RESEND_API_KEY=your_resend_api_key

PORT=5000
```

> Never commit actual credentials, API keys, JWT secrets, or database passwords to GitHub.

---

# Installation & Setup

## 1. Clone the Repository

```bash
git clone <repository-url>
cd AVIATO
```

---

## 2. Install Dependencies

```bash
npm install
```

or:

```bash
pnpm install
```

---

## 3. Configure Environment Variables

Create:

```text
.env
```

and add the required configuration.

---

## 4. Configure PostgreSQL

Create a PostgreSQL database and configure:

```env
DATABASE_URL=your_postgresql_connection_string
```

---

## 5. Run Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

Run migrations if required:

```bash
npx prisma migrate dev
```

---

## 6. Start the Application

Use the project's configured development script.

For example:

```bash
npm run dev
```

---

# Available Scripts

Common scripts may include:

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

Check `package.json` for the exact scripts available in the current version.

---

# Testing

Testing focuses on validating the major application workflows.

## Authentication Test

```text
Register
   ↓
Login
   ↓
Receive JWT
   ↓
Access Protected Route
```

---

## Flight Search Test

```text
Enter Search Parameters
        ↓
Call Flight API
        ↓
Normalize Response
        ↓
Display Results
```

---

## Booking Test

```text
Select Flight
      ↓
Select Seat
      ↓
Enter Passenger Details
      ↓
Confirm Booking
      ↓
Generate PNR
      ↓
Generate Boarding Pass
```

---

## Real-Time Test

Open the same flight in multiple browser sessions and verify that seat-state changes are propagated between connected clients.

---

# Current Project Status

| Feature                   | Status        |
| ------------------------- | ------------- |
| React Frontend            | ✅ Implemented |
| TypeScript                | ✅ Implemented |
| Flight Search             | ✅ Implemented |
| External Flight Provider  | ✅ Implemented |
| Flight Data Normalization | ✅ Implemented |
| Demo/Fallback Flight Data | ✅ Implemented |
| Authentication            | ✅ Implemented |
| JWT Authorization         | ✅ Implemented |
| Role-Based Access         | ✅ Implemented |
| Seat Selection            | ✅ Implemented |
| Real-Time Seat Updates    | ✅ Implemented |
| Booking Creation          | ✅ Implemented |
| PNR Generation            | ✅ Implemented |
| PostgreSQL Persistence    | ✅ Implemented |
| Prisma ORM                | ✅ Implemented |
| Email Confirmation        | ✅ Implemented |
| PDF Boarding Pass         | ✅ Implemented |
| User Dashboard            | ✅ Implemented |
| Admin Dashboard           | ✅ Implemented |
| WebSocket Communication   | ✅ Implemented |

---

# Future Scope

Potential future improvements include:

* Advanced flight filtering
* Airline-specific filtering
* Multi-city booking
* Multi-leg journeys
* Improved seat-locking mechanisms
* Booking cancellation
* Refund workflow
* More advanced admin analytics
* Production-grade monitoring
* Automated testing
* CI/CD pipeline
* Cloud deployment
* Redis-based real-time coordination
* Distributed WebSocket architecture
* Payment gateway integration
* Advanced notification systems

> Payment gateway integration is listed only as future scope and is **not part of the current implementation**.

---

# Scalability Considerations

The current application is designed with separation of responsibilities so that components can be replaced or scaled independently.

A future production architecture could look like:

```text
                         Load Balancer
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
         API Server       API Server       API Server
             │                │                │
             └────────────────┼────────────────┘
                              │
                              ▼
                         PostgreSQL
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
                  Redis          Background Workers
                    │                   │
                    ▼                   ▼
             WebSocket State       Email / Jobs
```

Possible production improvements include:

* Horizontal API scaling
* Redis
* Background job queues
* Database connection pooling
* CDN
* Containerization
* Kubernetes
* Centralized logging
* Monitoring
* Automated deployment

---

# Engineering Concepts Demonstrated

AVIATO demonstrates practical understanding of:

### Frontend Engineering

* React components
* React state
* Hooks
* Routing
* TypeScript
* Responsive UI
* API integration

### Backend Engineering

* REST APIs
* Express middleware
* Authentication
* Authorization
* Error handling
* Service abstraction

### Database Engineering

* Relational databases
* PostgreSQL
* Prisma ORM
* Database relationships
* Migrations

### Networking

* HTTP
* REST
* WebSockets
* Client-server architecture

### Security

* Password hashing
* JWT
* Role-based access
* Environment variables
* Protected routes

### Distributed-System Concepts

* Real-time synchronization
* External service dependencies
* Failure handling
* Service isolation
* Scalability

### Software Engineering

* Modular architecture
* Separation of concerns
* API abstraction
* Data normalization
* Reusable components
* Error handling

---

# Screenshots

Add application screenshots here.

Suggested screenshots:

```text
Landing Page
Flight Search
Flight Results
Seat Selection
Passenger Details
Booking Confirmation
User Dashboard
Admin Dashboard
Boarding Pass
```

# Documentation

Additional documentation can include:

* API documentation
* Database schema
* Architecture diagrams
* Setup instructions
* Environment configuration
* Deployment documentation

---

# Repository

The complete source code and project documentation are available in the project repository.

---

# Security Notice

Never commit sensitive information such as:

```text
.env
API Keys
JWT Secrets
Database Passwords
Access Tokens
Private Credentials
```

Use environment variables for all secrets.

If credentials are accidentally committed, revoke and regenerate them immediately.

---

# Disclaimer

AVIATO is an educational and portfolio project created to demonstrate full-stack software engineering concepts.

It is **not an actual airline reservation platform** and does not guarantee real-world flight availability, pricing, booking, or ticket issuance.

Flight information obtained from external services is used for demonstration purposes.

Any future payment integration would be a separate feature and is not part of the current implementation.

