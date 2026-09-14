const CallGatewayInterface = require('./CallGatewayInterface');

class ModemCallGateway extends CallGatewayInterface {
  constructor() {
    super();
    this.statusListeners = [];
    console.warn('[CallGateway] ModemCallGateway selected but NOT YET IMPLEMENTED.');
  }

  onStatus(callback) {
    this.statusListeners.push(callback);
  }

  async dial({ toNumber, audioFile, reminderId }) {
    throw new Error('ModemCallGateway.dial() not implemented yet. Use CALL_GATEWAY_MODE=mock or phone.');
  }

  async hangup(callId) {
    throw new Error('ModemCallGateway.hangup() not implemented yet.');
  }

  _emitStatus(event) {
    const fullEvent = { ...event, timestamp: new Date() };
    this.statusListeners.forEach((cb) => cb(fullEvent));
  }
}

module.exports = ModemCallGateway;