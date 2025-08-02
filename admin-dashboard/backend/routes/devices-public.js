const express = require('express');
const router = express.Router();
const handler = require('../../../api/devices');

// POST /api/devices?register=1
router.post('/', (req, res) => handler(req, res));
// DELETE /api/devices?remove=1&machineId=xxx
router.delete('/', (req, res) => handler(req, res));

module.exports = router;
