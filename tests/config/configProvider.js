const tape = require('tape');

const errors = require('../../src/errors');
const configProvider = require('../../src/config/configProvider');

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
