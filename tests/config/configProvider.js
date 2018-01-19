const tape = require('tape');

const errors = require('../../src/errors');
const extensionTools = require('../../src');
const configProvider = require('../../src/config/configProvider');

tape('extension-tools should expose the configProvider', function(t) {
  t.ok(extensionTools.configProvider === configProvider);
  t.end();
});

tape('configProvider#fromWebtaskContext should require a context', function(t) {
  try {
    configProvider.fromWebtaskContext();
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof errors.ArgumentError);
    t.end();
  }
});

tape('configProvider#fromWebtaskContext should require a context', function(t) {
  process.env.ENV1 = 'envValue';
  process.env.Setting = 123;

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

  t.ok(provider);
  t.equal(provider('ENV1'), 'envValue');
  t.equal(provider('HOSTING_ENV'), 'webtask');
  t.equal(provider('a'), 'value1');
  t.equal(provider('user'), 'usr');
  t.equal(provider('Setting'), 789);
  t.end();
});

tape('configProvider#fromWebtaskContext should return default RTA', function(t) {
  process.env.ENV1 = 'envValue';
  process.env.Setting = 123;

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

  t.ok(provider);
  t.equal(provider('AUTH0_RTA'), 'auth0.auth0.com');
  t.end();
});

tape('configProvider#fromWebtaskContext should allow overwriting the RTA', function(t) {
  process.env.ENV1 = 'envValue';
  process.env.Setting = 123;

  const provider = configProvider.fromWebtaskContext({
    params: {
      a: 'value1',
      b: 'value2',
      Setting: 456
    },
    secrets: {
      user: 'usr',
      password: 'pwd',
      Setting: 789,
      AUTH0_RTA: 'login.myappliance.local'
    }
  });

  t.ok(provider);
  t.equal(provider('AUTH0_RTA'), 'login.myappliance.local');
  t.end();
});

tape('configProvider#fromWebtaskContext should accept a seed object literal', function(t) {
  const seed = { seedKey: 'seedValue' };
  const provider = configProvider.fromWebtaskContext({}, seed);

  t.ok(provider);
  t.equal(provider('seedKey'), 'seedValue');
  t.end();
});

tape('configProvider#fromWebtaskContext should override seeded values', function(t) {
  const seed = { seedKey: 'seedValue' };
  const provider = configProvider.fromWebtaskContext({
    params: { seedKey: 'anotherValue' },
    secrets: {}
  }, seed);

  t.ok(provider);
  t.equal(provider('seedKey'), 'anotherValue');
  t.end();
});

tape('configProvider#fromWebtaskContext a seed must be able to override the AUTH0_RTA', function(t) {
  const seed = { AUTH0_RTA: 'not.auth0.auth0.com' };
  const provider = configProvider.fromWebtaskContext({}, seed);

  t.ok(provider);
  t.equal(provider('AUTH0_RTA'), 'not.auth0.auth0.com');
  t.end();
});
