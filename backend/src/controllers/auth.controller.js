const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function generateToken(users) {
  return jwt.sign(
    { id: users.id, role: users.role, email: users.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, role, phone_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone_number) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role || 'patient', phone_number || null]
    );

    const users = { id: result.insertId, email, role: role || 'patient' };
    const token = generateToken(users);

    return res.status(201).json({
      message: 'Registered successfully',
      token,
      users: { id: users.id, name, email, role: users.role },
    });
  } catch (err) {
    console.error('[auth.register] error:', err);
    return res.status(500).json({ error: 'Something went wrong during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows[0];

    if (!users) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, users.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(users);

    return res.json({
      message: 'Login successful',
      token,
      users: { id: users.id, name: users.name, email: users.email, role: users.role },
    });
  } catch (err) {
    console.error('[auth.login] error:', err);
    return res.status(500).json({ error: 'Something went wrong during login' });
  }
}

async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone_number, created_at FROM users WHERE id = ?',
      [req.users.id]
    );
    const users = rows[0];
    if (!users) {
      return res.status(404).json({ error: 'users not found' });
    }
    return res.json({ users });
  } catch (err) {
    console.error('[auth.getProfile] error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching profile' });
  }
}

module.exports = { register, login, getProfile };