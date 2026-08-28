### Backend project tructure 
  ```
medreminder-backend/
├── package.json
├── .env.example
└── src/
    ├── server.js                          # entry point
    ├── config/
    │   ├── db.js                          # MySQL connection pool
    │   └── migrate.js                     # creates tables (user, medicines, prescriptions, etc.)
    ├── middleware/
    │   └── auth.js                        # JWT verify middleware
    ├── routes/
    │   ├── auth.routes.js
    │   ├── medicine.routes.js
    │   ├── reminder.routes.js
    │   ├── prescription.routes.js
    │   └── chatbot.routes.js
    ├── controllers/
    │   ├── auth.controller.js             #authentication controller
    │   ├── medicine.controller.js
    │   └── reminder.controller.js
    ├── services/
    │   ├── reminderService.js             # core reminder+retry logic (calls CallGateway)
    │   ├── calendarService.js             # Google Calendar stub
    │   └── callGateway/
    │       ├── CallGatewayInterface.js    # the contract
    │       ├── MockCallGateway.js         # ACTIVE placeholder
    │       ├── ModemCallGateway.js        # STUB for real SIM800L later
    │       └── callGatewayFactory.js      # <-- ONLY file you touch to go live
    ├── jobs/
    │   └── reminderScheduler.js           # node-cron job (matches "Reminder Service" box)
    └── utils/
        └── logger.js 
 ```

### Database Layer

**`src/config/db.js`** — creates a MySQL connection pool using `mysql2/promise`, configured via environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`). Exports the pool for use across services and controllers.

**`src/config/migrate.js`** — runs once to create all required tables. Safe to re-run (`CREATE TABLE IF NOT EXISTS`). Closes the pool on completion via `pool.end()`.

#### Tables Created

| Table | Purpose |
|---|---|
| `users` | Stores registered users (patients/doctors/caregivers) with hashed passwords |
| `medicines` | Medicines added by a user, with dosage, frequency, and duration |
| `prescriptions` | Uploaded prescription files linked to a user |
| `reminders` | Scheduled reminders per medicine, with time and active status |
| `reminder_logs` | Tracks each reminder attempt (success/failure) for retry logic |

All child tables reference `users(id)` and/or `medicines(id)` / `reminders(id)` with `ON DELETE CASCADE`, so deleting a user or medicine cleans up related records automatically.

#### Environment Variables

Add these to your `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medreminder
```

#### Running the Migration

```bash
node src/config/migrate.js
```

This connects to the database and creates all tables in order (respecting foreign key dependencies: `users` → `medicines`/`prescriptions` → `reminders` → `reminder_logs`).
### Frontend project structure
```
frontend/
├── public/
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── MedicineCard.tsx
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ReminderCard.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatCard.tsx
│   │
│   ├── context/
│   │
│   ├── hooks/
│   │
│   ├── pages/
│   │   ├── Chatbot.tsx
│   │   ├── Dashboard.tsx
│   │   ├── History.tsx
│   │   ├── Login.tsx
│   │   ├── Medicines.tsx
│   │   ├── Prescriptions.tsx
│   │   ├── Register.tsx
│   │   └── Reminders.tsx
│   │
│   ├── services/
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── package.json
├── vite.config.ts
└── ...
```

### Frontend Tech Stack
- React
- TypeScript
- Vite
- React Router
- ESLint

### Frontend Pages

- Login
- Register
- Dashboard
- Manage Medicines
- Set Reminders
- Prescriptions
- History & Reports
- AI Chatbot

### Frontend Components

- Navbar
- Sidebar
- Medicine Card
- Reminder Card
- Stat Card
- Modal
- Protected Route`

