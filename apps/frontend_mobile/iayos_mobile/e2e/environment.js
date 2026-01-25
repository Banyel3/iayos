/**
 * Detox Jest Environment
 * This is required for Detox to work properly with Jest
 * It provides the global 'device' and other Detox APIs
 */
const DetoxCircusEnvironment = require('detox/runners/jest/DetoxCircusEnvironment');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomDetoxEnvironment;
