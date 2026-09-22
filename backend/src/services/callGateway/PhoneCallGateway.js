const axios = require('axios');
const CallGatewayInterface = require('./CallGatewayInterface');

const POLL_DELAY_MS = 15000;   // wait 15s after dialing before first status check
const POLL_INTERVAL_MS = 5000; // check every 5s after that
const POLL_MAX_ATTEMPTS = 12;  // give up after ~75s total of polling

class PhoneCallGateway extends CallGatewayInterface {
  constructor() {
    super();
    this.statusListeners = [];
    this.phoneGatewayUrl = process.env.PHONE_GATEWAY_URL;
    console.log(`[CallGateway] Using PHONE gateway at ${this.phoneGatewayUrl}`);
  }

  onStatus(callback) {
    this.statusListeners.push(callback);
  }

  _emitStatus(event) {
    const fullEvent = { ...event, timestamp: new Date() };
    this.statusListeners.forEach((cb) => cb(fullEvent));
  }

  async dial({ toNumber, audioFile, reminderId, attemptNumber }) {
    const callId = `phone-${reminderId}-${Date.now()}`;
    const dialedAt = Date.now();

    try {
      await axios.post(`${this.phoneGatewayUrl}/make-call`, {
        number: toNumber,
        reminderId,
      });

      console.log(`[PhoneCallGateway] Call placed to ${toNumber}, polling for outcome...`);
      this._emitStatus({ callId, reminderId, status: 'ringing', toNumber, audioFile, attemptNumber });

      this._pollCallStatus({ callId, reminderId, toNumber, audioFile, attemptNumber, dialedAt });

      return { callId, status: 'initiated', startedAt: new Date(dialedAt) };
    } catch (err) {
      console.error('[PhoneCallGateway] Failed to reach phone gateway:', err.message);
      this._emitStatus({ callId, reminderId, status: 'failed', toNumber, audioFile, attemptNumber });
      throw new Error('Could not reach phone gateway - is Termux server running and on the same WiFi?');
    }
  }

  async _pollCallStatus({ callId, reminderId, toNumber, audioFile, attemptNumber, dialedAt }) {
    await this._sleep(POLL_DELAY_MS);

    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      try {
        const res = await axios.get(`${this.phoneGatewayUrl}/call-status`, {
          params: { number: toNumber, since: dialedAt },
        });

        const { found, outcome, durationSeconds } = res.data;

        if (found) {
          console.log(`[PhoneCallGateway] Outcome for reminder ${reminderId}: ${outcome}`);

          if (outcome === 'connected') {
            this._emitStatus({
              callId,
              reminderId,
              status: 'completed',
              durationSeconds,
              toNumber,
              audioFile,
              attemptNumber,
            });
          } else {
            this._emitStatus({
              callId,
              reminderId,
              status: 'no_answer',
              toNumber,
              audioFile,
              attemptNumber,
            });
          }
          return;
        }
      } catch (err) {
        console.error('[PhoneCallGateway] call-status check failed:', err.message);
      }

      await this._sleep(POLL_INTERVAL_MS);
    }

    console.log(`[PhoneCallGateway] No call-status found after polling for reminder ${reminderId}, assuming no_answer`);
    this._emitStatus({
      callId,
      reminderId,
      status: 'no_answer',
      toNumber,
      audioFile,
      attemptNumber,
    });
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async hangup(callId) {
    console.log('[PhoneCallGateway] Hangup not supported via Termux for callId:', callId);
  }
}

module.exports = PhoneCallGateway;