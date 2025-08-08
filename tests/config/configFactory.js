const { expect } = require('chai');

const extensionTools = require('../../src');
const configFactory = require('../../src/config/configFactory');
const configProvider = require('../../src/config/configProvider');

describe('configFactory', function() {
  it('should be exposed in extension-tools', function() {
    expect(extensionTools.config).to.equal(configFactory);
  });

  it('should wrap provider', function() {
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

    expect(config).to.be.ok;
    expect(config('a')).to.equal('value1');
    expect(config('user')).to.equal('usr');
    expect(config('Setting')).to.equal(789);
  });

  it('should allow getting custom values with setValue', function() {
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
    config.setValue('foo', 'bar');

    expect(config).to.be.ok;
    expect(config('foo')).to.equal('bar');
    expect(config('a')).to.equal('value1');
    expect(config('user')).to.equal('usr');
    expect(config('Setting')).to.equal(789);
  });

  it('should throw error if provider not set', function() {
    expect(function() {
      const config = configFactory();
      config('a');
    }).to.throw('A configuration provider has not been set');
  });
});
