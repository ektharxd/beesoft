require('dotenv').config({ path: '../../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');
const adminCreateSuperadmin = require('../../api/admin-create-superadmin');
const deviceRoutes = require('./routes/devices');
const licenseRoutes = require('./routes/licenses');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/beesoft';

// Configure mongoose to not buffer commands
mongoose.set('bufferCommands', false);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});


app.use('/api/admin-create-superadmin', adminCreateSuperadmin);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/devices', deviceRoutes);
app.use('/api/admin/licenses', licenseRoutes);

app.get('/', (req, res) => {
  res.send('Beesoft Admin API running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin API server running on port ${PORT}`);
});
