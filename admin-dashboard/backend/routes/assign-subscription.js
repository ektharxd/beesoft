const express = require('express');
const router = express.Router();
const handler = require('../../../api/assign-subscription');

router.post('/', (req, res) => handler(req, res));

module.exports = router;
