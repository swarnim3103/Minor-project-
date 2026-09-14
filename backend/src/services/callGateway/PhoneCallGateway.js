const axios = require('axios');
const CallGatewayInterface = require('./CallGatewayInterface');

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

  async dial({ toNumber, audioFile, reminderId }) {
    try {
      const response = await axios.post(`${this.phoneGatewayUrl}/make-call`, {
        number: toNumber,
        reminderId,
      });

      const callId = `phone-${reminderId}-${Date.now()}`;
      this._emitStatus({ callId, reminderId, status: 'ringing' });

      console.log('[PhoneCallGateway] Call placed:', response.data);
      return { callId, status: 'initiated', startedAt: new Date() };
    } catch (err) {
      console.error('[PhoneCallGateway] Failed to reach phone gateway:', err.message);
      throw new Error('Could not reach phone gateway - is Termux server running and on the same WiFi?');
    }
  }

  async hangup(callId) {
    console.log('[PhoneCallGateway] Hangup not fully supported yet for callId:', callId);
  }
}

module.exports = PhoneCallGateway;