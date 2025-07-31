// Simple test endpoint to verify JWT authentication
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Simple JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Test endpoint - Token received:', token ? 'Present' : 'Missing');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beesoft_secret');
    console.log('Test endpoint - Token decoded:', decoded);
    req.admin = decoded;
    next();
  } catch (error) {
    console.log('Test endpoint - Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/test-auth - Simple test endpoint
router.get('/', verifyToken, async (req, res) => {
  console.log('Test endpoint - Successfully authenticated user:', req.admin);
  res.json({ 
    success: true, 
    message: 'Authentication working!', 
    user: req.admin,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
