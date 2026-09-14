const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, reminderController.createReminder);
router.get('/', authenticate, reminderController.getMyReminders);
router.patch('/:id', authenticate, reminderController.updateReminder);
router.delete('/:id', authenticate, reminderController.deleteReminder);

module.exports = router;