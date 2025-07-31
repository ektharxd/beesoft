require('dotenv').config();
const express = require('express');
const router = express.Router();
// const Admin = require('../models/Admin');
const Superadmin = require('../models/Superadmin');
const jwt = require('jsonwebtoken');

// Hardcoded superadmin credentials for first run
const SUPERADMIN = {
  username: 'ekthar',
  password: 'ekthar@8302',
};

// Function to create superadmin - will be called after DB connection
const createSuperadmin = async () => {
  try {
    // Check if superadmin exists in superadmin collection
    const superadmin = await Superadmin.findOne({ 
      $or: [{ username: SUPERADMIN.username }, { userId: SUPERADMIN.username }] 
    });
    if (!superadmin) {
      const newSuperadmin = new Superadmin({ 
        username: SUPERADMIN.username, 
        password: SUPERADMIN.password,
        role: 'superadmin'
      });
      await newSuperadmin.save();
      console.log('Superadmin created in superadmin collection with username field');
    } else {
      console.log('Superadmin already exists');
    }
  } catch (error) {
    console.error('Error creating superadmin:', error);
  }
};


// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Only check Superadmin collection
  let admin = await Superadmin.findOne({ 
    $or: [{ username }, { userId: username }] 
  });
  
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  
  // Use the comparePassword method (works for both models now)
  const valid = await admin.comparePassword(password);
  
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  
  // Use the correct username field
  const displayUsername = admin.username || admin.userId;
  
  // Issue JWT (for demo, secret is hardcoded)
  const token = jwt.sign({ id: admin._id, username: displayUsername, role: admin.role || 'superadmin' }, process.env.JWT_SECRET || 'beesoft_secret', { expiresIn: '1d' });
  res.json({ token, username: displayUsername, role: admin.role || 'superadmin' });
});

// POST /api/admin/create - Create new admin (superadmin only)
router.post('/create', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  
  // Check if user exists in Superadmin collection only
  const existsInSuperadmin = await Superadmin.findOne({ 
    $or: [{ username }, { userId: username }] 
  });
  if (existsInSuperadmin) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // Create new admin in Superadmin collection
  const newSuperadmin = new Superadmin({ 
    username, 
    password, 
    role 
  });
  await newSuperadmin.save();
  
  res.json({ success: true, admin: { username, role } });
});

// GET /api/admin/list - List all admins (superadmin only)
router.get('/list', async (req, res) => {
  try {
    // Fetch only from Superadmin collection
    const superadmins = await Superadmin.find({}, '-password');
    console.log('Superadmins found:', superadmins.length);
    console.log('Sample superadmin data:', superadmins[0]);
    // Return only superadmins
    res.json({ admins: superadmins });
  } catch (error) {
    console.error('Error fetching superadmins:', error);
    res.status(500).json({ error: 'Failed to fetch admin list' });
  }
});

// POST /api/admin/change-password - Change password (self or by superadmin)
router.post('/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  
  // Only check Superadmin collection
  let admin = await Superadmin.findOne({ 
    $or: [{ username }, { userId: username }] 
  });
  
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  
  // If not superadmin, require old password
  if (admin.role !== 'superadmin') {
    if (!oldPassword) return res.status(400).json({ error: 'Old password required' });
    const valid = await admin.comparePassword(oldPassword);
    if (!valid) return res.status(401).json({ error: 'Old password incorrect' });
  }
  
  // Update password using the setPassword method
  await admin.setPassword(newPassword);
  
  res.json({ success: true });
});

// Initialize superadmin when this module loads
setTimeout(createSuperadmin, 2000); // Wait 2 seconds for DB connection

module.exports = router;
