const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://iakuphjfnnpftcgamhev.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3VwaGpmbnBmdGNnYW1oZXYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU1ODQ4NywiZXhwIjoyMDQ4MTM0NDg3fQ.3JdYh9LxhU_QBqRJTaEBFGfxAL4Nh2YR7qZelHfQVp0'
);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    return res.status(200).json({
      success: true,
      token: data.session.access_token,
      user: data.user,
      session: data.session,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again' });
  }
};