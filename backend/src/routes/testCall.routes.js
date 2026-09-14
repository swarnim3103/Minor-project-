const express = require('express');
const router = express.Router();
const { getCallGateway } = require('../services/callGateway/callGatewayFactory');

/**
 * TEMPORARY test route - lets you manually trigger a call without
 * waiting for the scheduler or having real reminder data in the DB.
 * Remove or protect this before going to production.
 *
 * POST /api/test-call
 * Body: { "number": "9876543210" }
 */
router.post('/test-call', async (req, res) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({ error: 'number is required' });
    }

    const gateway = getCallGateway();

    const result = await gateway.dial({
      toNumber: number,
      audioFile: 'test_reminder.mp3', // not used yet in phone mode, but kept for consistency
      reminderId: 'test-' + Date.now(),
    });

    return res.json({
      message: 'Call triggered',
      result,
      mode: process.env.CALL_GATEWAY_MODE,
    });
  } catch (err) {
    console.error('[test-call] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;