// DEPRECATED: This endpoint is now handled by admin-dashboard/backend/routes/admin.js
// This file exists only to prevent module loading errors

module.exports = function handler(req, res) {
  res.status(404).json({ 
    error: 'This endpoint has been moved to /api/admin/admin' 
  });
};