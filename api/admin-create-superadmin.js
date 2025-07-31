// api/admin-create-superadmin.js
// One-time-use endpoint to create the first superadmin if none exists
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const router = express.Router();

// Use the same MongoDB URI as the main backend
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/beesoft';
const SUPERADMIN_COLLECTION = 'superadmin';

// Connect if not already connected
if (mongoose.connection.readyState === 0) {
  console.log('Connecting to MongoDB URI (admin-create-superadmin.js):', MONGO_URI);
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Connected to MongoDB (admin-create-superadmin.js)');
    })
    .catch((err) => {
      console.error('MongoDB connection error (admin-create-superadmin.js):', err.message);
    });
}

const superadminSchema = new mongoose.Schema({
  userId: String,
  password: String,
  role: String,
}, { collection: SUPERADMIN_COLLECTION });

const Superadmin = mongoose.models.Superadmin || mongoose.model('Superadmin', superadminSchema);

// POST /api/admin-create-superadmin
// Body: { userId, password, role }
router.post('/', async (req, res) => {
  try {
    // Only allow if no superadmin exists
    const count = await Superadmin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ error: 'Superadmin already exists. Endpoint disabled.' });
    }
    const { userId, password, role } = req.body;
    if (!userId || !password || !role) {
      return res.status(400).json({ error: 'Missing userId, password, or role' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await Superadmin.create({ userId, password: hashedPassword, role });
    return res.json({ success: true, message: 'Superadmin created. Endpoint now disabled.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
