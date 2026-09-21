
require('dotenv').config();

const jwt = require('jsonwebtoken');

const express = require('express');
const cors = require('cors');
const testCallRoutes = require('./routes/testCall.routes');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const medicineRoutes = require("./routes/medicine.routes");
const pool = require('./config/db');
const reminderRoutes = require('./routes/reminder.routes');
const otpRoutes = require('./routes/otp.routes');
const app = express();
const { startReminderScheduler } = require('./jobs/reminderScheduler');
app.use(cors());
app.use(express.json());
app.use('/api', testCallRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/medicines", medicineRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/reminders', reminderRoutes);
const chatRoutes = require("./routes/chat.routes");
app.use('/api/chat', chatRoutes);
// TEMPORARY DEVELOPMENT LOGIN
// Remove this before deploying the backend publicly.
app.post('/api/dev-login', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = 12 LIMIT 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Development user with ID 12 not found',
      });
    }

    const user = rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Development login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Dev login error:', error);

    res.status(500).json({
      message: 'Development login failed',
    });
  }
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS result');

    res.json({
      status: 'ok',
      database: 'connected',
      result: rows[0].result
    });
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      status: 'error',
      database: 'connection failed'
    });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startReminderScheduler();
});