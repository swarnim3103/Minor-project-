const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, historyController.getHistory);
router.get('/adherence', authenticate, historyController.getAdherence);

module.exports = router;