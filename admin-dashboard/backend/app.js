require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const deviceRoutes = require('./routes/devices');
const licenseRoutes = require('./routes/licenses');
const messageLimitsRoutes = require('./routes/message-limits');
const adminRoutes = require('./routes/admin');
const deviceStatusRoute = require('./routes/device-status');
const assignSubscriptionRoute = require('./routes/assign-subscription');
const deviceHeartbeatsRoute = require('./routes/device-heartbeats');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Only Supabase is used now. Remove all MongoDB/Mongoose logic.



app.use('/api/admin/devices', deviceRoutes);
app.use('/api/admin/licenses', licenseRoutes);
app.use('/api/message-limits', messageLimitsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/device-status', deviceStatusRoute);
app.use('/api/assign-subscription', assignSubscriptionRoute);
app.use('/api/device-heartbeats', deviceHeartbeatsRoute);
const devicesPublicRoute = require('./routes/devices-public');
app.use('/api/devices', devicesPublicRoute);

app.get('/', (req, res) => {
  res.send('Beesoft Admin API running');
});

const PORT = process.env.ADMIN_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin API server running on port ${PORT}`);
});
