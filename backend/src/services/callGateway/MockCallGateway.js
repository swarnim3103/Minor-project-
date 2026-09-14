const { v4: uuidv4 } = require('uuid');
const CallGatewayInterface = require('./CallGatewayInterface');

class MockCallGateway extends CallGatewayInterface {
  constructor() {
    super();
    this.statusListeners = [];
    this.activeCalls = new Map();
    console.log('[CallGateway] Running in MOCK mode - no real calls or telecom cost.');
  }

  onStatus(callback) {
    this.statusListeners.push(callback);
  }

  _emitStatus(event) {
    const fullEvent = { ...event, timestamp: new Date() };
    this.statusListeners.forEach((cb) => cb(fullEvent));
  }

  async dial({ toNumber, audioFile, reminderId, attemptNumber }) {
  const callId = uuidv4();
  const startedAt = new Date();
  const meta = { toNumber, audioFile, attemptNumber };

  console.log(`[MOCK CALL] Dialing ${toNumber} | reminderId=${reminderId} | audio="${audioFile}"`);
  this.activeCalls.set(callId, { toNumber, audioFile, reminderId, startedAt });

  setTimeout(() => this._emitStatus({ callId, reminderId, status: 'ringing', ...meta }), 500);

  const dialDelayMs = 2000 + Math.random() * 2000;
  setTimeout(() => {
    const outcome = this._simulateOutcome();

    if (outcome === 'connected') {
      this._emitStatus({ callId, reminderId, status: 'connected', ...meta });
      const playbackSeconds = 8 + Math.floor(Math.random() * 8);

      setTimeout(() => {
        this._emitStatus({ callId, reminderId, status: 'completed', durationSeconds: playbackSeconds, ...meta });
        this.activeCalls.delete(callId);
      }, playbackSeconds * 100);
    } else {
      this._emitStatus({ callId, reminderId, status: outcome, ...meta });
      this.activeCalls.delete(callId);
    }
  }, dialDelayMs);

  return { callId, status: 'initiated', startedAt };
}

  async hangup(callId) {
    if (this.activeCalls.has(callId)) {
      this.activeCalls.delete(callId);
      this._emitStatus({ callId, status: 'completed', durationSeconds: 0 });
    }
  }

  _simulateOutcome() {
    const r = Math.random();
    if (r < 0.65) return 'connected';
    if (r < 0.85) return 'no_answer';
    return 'busy';
  }
}

module.exports = MockCallGateway;