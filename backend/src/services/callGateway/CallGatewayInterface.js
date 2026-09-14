class CallGatewayInterface {
  async dial({ toNumber, audioFile, reminderId }) {
    throw new Error('dial() not implemented');
  }
  onStatus(callback) {
    throw new Error('onStatus() not implemented');
  }
  async hangup(callId) {
    throw new Error('hangup() not implemented');
  }
}

module.exports = CallGatewayInterface;