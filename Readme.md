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




---

### Frontend project structure

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
``

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