const { expect } = require('chai');

const errors = require('../../src/errors');
const extensionTools = require('../../src');
const configProvider = require('../../src/config/configProvider');

describe('configProvider', function() {
  it('should be exposed in extension-tools', function() {
    expect(extensionTools.configProvider).to.equal(configProvider);
  });

  it('should require a context in fromWebtaskContext', function() {
    expect(function() {
      configProvider.fromWebtaskContext();
    }).to.throw(errors.ArgumentError);
  });

  it('should create provider from webtask context', function() {
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

    expect(provider).to.be.ok;
    expect(provider('ENV1')).to.equal('envValue');
    expect(provider('HOSTING_ENV')).to.equal('webtask');
    expect(provider('a')).to.equal('value1');
    expect(provider('user')).to.equal('usr');
    expect(provider('Setting')).to.equal(789);
  });

  it('should return default RTA in fromWebtaskContext', function() {
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

    expect(provider).to.be.ok;
    expect(provider('AUTH0_RTA')).to.equal('auth0.auth0.com');
  });

  it('should allow overwriting the RTA in fromWebtaskContext', function() {
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

    expect(provider).to.be.ok;
    expect(provider('AUTH0_RTA')).to.equal('login.myappliance.local');
  });
});
