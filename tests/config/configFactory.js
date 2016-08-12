const tape = require('tape');

const extensionTools = require('../../src');
const configFactory = require('../../src/config/configFactory');
const configProvider = require('../../src/config/configProvider');

tape('extension-tools should expose the configFactory', function(t) {
  t.ok(extensionTools.config === configFactory);
  t.end();
});

tape('configFactory should wrap provider', function(t) {
  const provider = configProvider.fromWebtaskContext({
    params: {
      a: 'value1',
      b: 'value2',
      Setting: 456
    },
    secrets: {
      user: 'usr',
      password: 'pwd',
      Setting: 789
    }
  });

  const config = configFactory();
  config.setProvider(provider);

  t.ok(config);
  t.equal(config('a'), 'value1');
  t.equal(config('user'), 'usr');
  t.equal(config('Setting'), 789);
  t.end();
});

tape('configFactory should throw error if provider not set', function(t) {
  try {
    const config = configFactory();
    config('a');
  } catch (e) {
    t.ok(e);
    t.equal(e.message, 'A configuration provider has not been set');
    t.end();
  }
});
