const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML files from the root directory
app.use(express.static(__dirname));

// Default route to serve admin dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard-new.html'));
});

// Specific route for admin dashboard
app.get('/admin-dashboard-new.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard-new.html'));
});

// Route for admin login
app.get('/admin-login-secure.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login-secure.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin-dashboard-new.html`);
  console.log(`Admin Login: http://localhost:${PORT}/admin-login-secure.html`);
});
