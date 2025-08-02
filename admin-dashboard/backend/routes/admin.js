const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// POST /api/admin/login (Supabase Auth)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ error: 'Invalid email or password' });
      } else if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'Please confirm your email address' });
      } else if (error.message.includes('Too many requests')) {
        return res.status(429).json({ error: 'Too many login attempts. Please try again later' });
      } else {
        return res.status(401).json({ error: 'Login failed. Please check your credentials' });
      }
    }
    
    if (!data.session?.access_token) {
      return res.status(500).json({ error: 'Authentication failed. Please try again' });
    }
    
    return res.json({
      token: data.session.access_token,
      user: data.user,
      session: data.session,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again' });
  }
});

// POST /api/admin/signup (Supabase Auth)
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ user: data.user });
});

// GET /api/admin/session (validate session)
router.get('/session', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: error.message });
  return res.json({ user: data.user });
});

module.exports = router;
