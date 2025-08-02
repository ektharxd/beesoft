// Simple test API endpoint
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Beesoft API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};
