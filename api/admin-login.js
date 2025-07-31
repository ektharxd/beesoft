

// Secure admin login API for superadmin table
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Connect to MongoDB using URI from environment variable
if (!mongoose.connection.readyState) {
  console.log('Connecting to MongoDB URI:', process.env.MONGODB_URI);
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('Connected to MongoDB (admin-login.js)');
  }).catch((err) => {
    console.error('MongoDB connection error (admin-login.js):', err.message);
  });
}

// SuperAdmin schema
const superAdminSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, default: 'superadmin' }
}, { collection: 'superadmin' });
const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema);

// POST /api/admin-login
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, passwordPresent: !!password });
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const admin = await SuperAdmin.findOne({ userId: username });
    console.log('Found admin:', admin ? { userId: admin.userId, role: admin.role, hashLength: admin.password.length } : null);
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', valid);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    // Issue JWT
    const token = jwt.sign({ userId: admin.userId, username: admin.userId, role: admin.role }, process.env.JWT_SECRET || 'beesoft_secret', { expiresIn: '2h' });
    res.json({ token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;