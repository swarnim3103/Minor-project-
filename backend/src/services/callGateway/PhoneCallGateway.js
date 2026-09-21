const axios = require('axios');
const CallGatewayInterface = require('./CallGatewayInterface');

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // give up and treat as no_answer after 90s

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
    try {
      const response = await axios.post(`${this.phoneGatewayUrl}/make-call`, {
        number: toNumber,
        reminderId,
      });

      const callId = `phone-${reminderId}-${Date.now()}`;
      const dialedAt = new Date();

      this._emitStatus({ callId, reminderId, status: 'ringing', toNumber, audioFile, attemptNumber });

      console.log('[PhoneCallGateway] Call placed:', response.data);

      // termux-telephony-call can't report call state on its own, so poll
      // the gateway's call-log endpoint until an outcome shows up.
      this._pollForOutcome({ callId, reminderId, toNumber, audioFile, attemptNumber, dialedAt });

      return { callId, status: 'initiated', startedAt: dialedAt };
    } catch (err) {
      console.error('[PhoneCallGateway] Failed to reach phone gateway:', err.message);
      throw new Error('Could not reach phone gateway - is Termux server running and on the same WiFi?');
    }
  }

  _pollForOutcome({ callId, reminderId, toNumber, audioFile, attemptNumber, dialedAt }) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const poll = async () => {
      if (Date.now() > deadline) {
        console.warn(`[PhoneCallGateway] Gave up waiting for outcome of reminder ${reminderId}`);
        this._emitStatus({ callId, reminderId, status: 'no_answer', toNumber, audioFile, attemptNumber });
        return;
      }

      try {
        const { data } = await axios.get(`${this.phoneGatewayUrl}/call-status`, {
          params: { number: toNumber, since: dialedAt.getTime() },
        });

        // Expected response shape from the Termux gateway:
        // { found: boolean, outcome: 'connected' | 'no_answer' | 'busy', durationSeconds: number }
        if (data.found) {
          if (data.outcome === 'connected') {
            this._emitStatus({ callId, reminderId, status: 'connected', toNumber, audioFile, attemptNumber });
            this._emitStatus({
              callId,
              reminderId,
              status: 'completed',
              durationSeconds: data.durationSeconds || 0,
              toNumber,
              audioFile,
              attemptNumber,
            });
          } else {
            this._emitStatus({ callId, reminderId, status: data.outcome, toNumber, audioFile, attemptNumber });
          }
          return; // outcome found, stop polling
        }
      } catch (err) {
        console.error('[PhoneCallGateway] Poll failed:', err.message);
        // transient error - keep polling rather than giving up immediately
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, POLL_INTERVAL_MS);
  }

  async hangup(callId) {
    console.log('[PhoneCallGateway] Hangup not fully supported yet for callId:', callId);
  }
}

module.exports = PhoneCallGateway;  