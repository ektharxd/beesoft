const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Hardcoded superadmin credentials for first run
const SUPERADMIN = {
  username: 'ekthar',
  password: 'ekthar@8302',
};

// Function to create superadmin - will be called after DB connection
const createSuperadmin = async () => {
  try {
    const admin = await Admin.findOne({ username: SUPERADMIN.username });
    if (!admin) {
      const newAdmin = new Admin({ username: SUPERADMIN.username, password: SUPERADMIN.password });
      await newAdmin.save();
      console.log('Superadmin created in DB');
    }
  } catch (error) {
    console.error('Error creating superadmin:', error);
  }
};

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await admin.comparePassword(password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  // Issue JWT (for demo, secret is hardcoded)
  const token = jwt.sign({ id: admin._id, username: admin.username }, 'beesoft_secret', { expiresIn: '1d' });
  res.json({ token, username: admin.username });
});

module.exports = { router, createSuperadmin };
