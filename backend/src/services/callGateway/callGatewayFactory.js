const MockCallGateway = require('./MockCallGateway');
const ModemCallGateway = require('./ModemCallGateway');
const PhoneCallGateway = require('./PhoneCallGateway');

let instance = null;

function getCallGateway() {
  if (instance) return instance;

  const mode = process.env.CALL_GATEWAY_MODE || 'mock';

  if (mode === 'modem') {
    instance = new ModemCallGateway();
  } else if (mode === 'phone') {
    instance = new PhoneCallGateway();
  } else {
    instance = new MockCallGateway();
  }

  return instance;
}

module.exports = { getCallGateway };