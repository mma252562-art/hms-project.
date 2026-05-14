# 🏥 MediCore Hospital Management System

Full-stack Hospital Management System built with **Node.js + Express**, **React**, **PostgreSQL**, and **Prisma ORM**.

---

## 📦 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Node.js, Express, MVC architecture      |
| Frontend   | React 18, React Router v6, Axios        |
| Database   | PostgreSQL                              |
| ORM        | Prisma                                  |
| Auth       | JWT (jsonwebtoken + bcryptjs)           |
| Styling    | Custom CSS (no UI lib needed)           |

---

## 🗂 Project Structure

```
hms/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← Database schema
│   │   └── seed.js             ← Demo data
│   └── src/
│       ├── controllers/        ← Route handlers
│       ├── services/           ← Business logic
│       ├── routes/             ← Express routers
│       ├── middleware/         ← Auth + error middleware
│       ├── utils/              ← Prisma client singleton
│       └── server.js           ← Entry point (port 5000)
│
└── frontend/
    └── src/
        ├── context/            ← AuthContext (JWT state)
        ├── pages/              ← Dashboard, Patients, Doctors, Appts, Billing
        ├── components/         ← Layout / Sidebar
        ├── utils/api.js        ← Axios with JWT interceptors
        └── App.js              ← Routes + protected routes
```

---

## 🔑 Features

- ✅ **Auth**: Register, Login, JWT, Role-based (Admin/Doctor/Nurse/Receptionist)
- ✅ **Patients**: Full CRUD, search & pagination, medical history view
- ✅ **Doctors**: Add/edit doctors, specializations, weekly schedule
- ✅ **Appointments**: Book, edit, cancel, filter by date/status/doctor
- ✅ **Billing**: Create invoices with line items, mark paid, revenue summary
- ✅ **Dashboard**: Live stats from DB (patients, appointments, revenue)

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- PostgreSQL v14+ running locally
- npm or yarn

---

### Step 1 — PostgreSQL Setup

```sql
-- In psql or pgAdmin, run:
CREATE DATABASE hms_db;
CREATE USER hms_user WITH ENCRYPTED PASSWORD 'hms_pass';
GRANT ALL PRIVILEGES ON DATABASE hms_db TO hms_user;
```

Or use your existing postgres superuser and just create the database:
```bash
createdb hms_db
```

---

### Step 2 — Backend Setup

```bash
cd hms/backend

# Copy env file and configure it
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hms_db?schema=public"
JWT_SECRET="change-this-to-a-long-random-secret-string"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

```bash
# Install dependencies
npm install

# Push schema to PostgreSQL
npx prisma db push

# Seed demo data
node prisma/seed.js

# Start backend
npm run dev
```

Backend is now running at **http://localhost:5000**

---

### Step 3 — Frontend Setup

```bash
cd hms/frontend

# Copy env file
cp .env.example .env
# (REACT_APP_API_URL=http://localhost:5000/api — already set)

# Install dependencies
npm install

# Start frontend
npm start
```

Frontend is now running at **http://localhost:3000**

---

## 🔐 Demo Login Credentials

| Role         | Email                      | Password    |
|--------------|----------------------------|-------------|
| Admin        | admin@hospital.com         | admin123    |
| Receptionist | reception@hospital.com     | recep123    |
| Nurse        | nurse@hospital.com         | nurse123    |
| Doctor       | dr.smith@hospital.com      | doctor123   |
| Doctor       | dr.patel@hospital.com      | doctor123   |

---

## 📡 API Reference

### Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"pass123","firstName":"John","lastName":"Doe","role":"RECEPTIONIST"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'

# Get profile (requires token)
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Patients

```bash
# List all patients (paginated)
curl http://localhost:5000/api/patients?page=1&limit=10 \
  -H "Authorization: Bearer TOKEN"

# Search patients
curl "http://localhost:5000/api/patients?search=alice" \
  -H "Authorization: Bearer TOKEN"

# Create patient
curl -X POST http://localhost:5000/api/patients \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "phone": "555-1234",
    "dateOfBirth": "1990-01-15",
    "gender": "FEMALE",
    "bloodGroup": "O+",
    "address": "123 Main St"
  }'

# Update patient
curl -X PUT http://localhost:5000/api/patients/PATIENT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "555-9999"}'

# Delete (deactivate) patient
curl -X DELETE http://localhost:5000/api/patients/PATIENT_ID \
  -H "Authorization: Bearer TOKEN"
```

### Doctors

```bash
# List all doctors
curl http://localhost:5000/api/doctors \
  -H "Authorization: Bearer TOKEN"

# Filter by specialization
curl "http://localhost:5000/api/doctors?specialization=SPEC_ID" \
  -H "Authorization: Bearer TOKEN"

# Get specializations
curl http://localhost:5000/api/doctors/specializations \
  -H "Authorization: Bearer TOKEN"

# Create doctor (Admin only)
curl -X POST http://localhost:5000/api/doctors \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.new@hospital.com",
    "password": "doctor123",
    "firstName": "Alice",
    "lastName": "Smith",
    "phone": "555-7777",
    "specializationId": "SPEC_ID",
    "licenseNumber": "LIC-999",
    "experience": 5,
    "consultationFee": 120
  }'

# Update doctor schedule
curl -X PUT http://localhost:5000/api/doctors/DOCTOR_ID/schedule \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schedules": [
      {"dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "slotDuration": 30},
      {"dayOfWeek": 3, "startTime": "10:00", "endTime": "15:00", "slotDuration": 30}
    ]
  }'
```

### Appointments

```bash
# List appointments
curl http://localhost:5000/api/appointments \
  -H "Authorization: Bearer TOKEN"

# Filter by date
curl "http://localhost:5000/api/appointments?date=2025-01-15" \
  -H "Authorization: Bearer TOKEN"

# Filter by status
curl "http://localhost:5000/api/appointments?status=SCHEDULED" \
  -H "Authorization: Bearer TOKEN"

# Book appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PATIENT_ID",
    "doctorId": "DOCTOR_ID",
    "scheduledAt": "2025-06-01T10:00:00",
    "duration": 30,
    "reason": "Annual checkup"
  }'

# Update appointment (e.g., add diagnosis)
curl -X PUT http://localhost:5000/api/appointments/APPT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "diagnosis": "Hypertension",
    "prescription": "Lisinopril 10mg daily"
  }'

# Cancel appointment
curl -X PATCH http://localhost:5000/api/appointments/APPT_ID/cancel \
  -H "Authorization: Bearer TOKEN"

# Get upcoming appointments
curl http://localhost:5000/api/appointments/upcoming \
  -H "Authorization: Bearer TOKEN"
```

### Billing

```bash
# List bills
curl http://localhost:5000/api/billing \
  -H "Authorization: Bearer TOKEN"

# Revenue summary
curl http://localhost:5000/api/billing/summary \
  -H "Authorization: Bearer TOKEN"

# Create invoice
curl -X POST http://localhost:5000/api/billing \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PATIENT_ID",
    "appointmentId": "APPT_ID",
    "discount": 0,
    "tax": 15,
    "notes": "Payment due in 30 days",
    "items": [
      {"description": "Consultation Fee", "quantity": 1, "unitPrice": 150},
      {"description": "Lab Tests", "quantity": 2, "unitPrice": 45},
      {"description": "Medications", "quantity": 1, "unitPrice": 30}
    ]
  }'

# Mark bill as paid
curl -X PATCH http://localhost:5000/api/billing/BILL_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID"}'
```

### Dashboard

```bash
# Get all live stats
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer TOKEN"
```

---

## 🗄 Database Schema Overview

```
users          ← Auth accounts (all roles)
  └── doctors  ← Doctor-specific profile (1:1 with users)
      └── schedules     ← Weekly availability
      └── appointments  ← Bookings

patients       ← Patient records
  └── appointments  ← Linked bookings
  └── bills         ← Invoices

appointments   ← Links patient ↔ doctor
  └── bill      ← Optional 1:1 invoice

bills          ← Invoice header
  └── bill_items  ← Line items

specializations  ← Doctor specialties (ref table)
```

---

## 🛠 Prisma Commands

```bash
# View/edit database in browser
npx prisma studio

# Reset database and re-seed
npx prisma db push --force-reset && node prisma/seed.js

# Generate Prisma Client after schema changes
npx prisma generate

# Create a migration
npx prisma migrate dev --name add_new_field
```

---

## ⚠️ Troubleshooting

**"Cannot connect to database"**
→ Check your `DATABASE_URL` in `.env`. Make sure PostgreSQL is running.

**"JWT secret undefined"**  
→ Make sure `.env` is in the `backend/` folder, not the project root.

**CORS errors in browser**  
→ Ensure backend is running on port 5000 and `CORS_ORIGIN=http://localhost:3000` is set.

**Prisma P2002 (unique constraint)**  
→ You're inserting a duplicate email or license number.

**Frontend shows "Network Error"**  
→ Backend is not running. Start it with `npm run dev` in the `backend/` folder.
