const { expect } = require('chai');

const extensionTools = require('../src');
const HookTokenError = require('../src/errors').HookTokenError;
const validateHookToken = require('../src/validateHookToken');

describe('validateHookToken', function() {
  it('should be exposed in extension-tools', function() {
    expect(extensionTools.validateHookToken).to.equal(validateHookToken);
  });

  it('should require a token', function() {
    expect(function() {
      validateHookToken();
    }).to.throw(HookTokenError);
  });

  it('should reject invalid tokens', function() {
    expect(function() {
      validateHookToken('me.auth0.com', 'https://webtask.io/run/abc', '/extension/uninstall', 'mysecret', 'faketoken');
    }).to.throw(HookTokenError);
  });

  it('should accept valid tokens', function() {
    const isValid = validateHookToken('me.auth0.com', 'https://webtask.io/run/abc', '/extension/uninstall', 'mysecret',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL21lLmF1dGgwLmNvbSIsImF1ZCI6Imh0dHBzOi8vd2VidGFzay5pby9ydW4vYWJjL2V4dGVuc2lvbi91bmluc3RhbGwifQ.fdAaM7cLdirmv4KyQ46Vq4eat04gRb7KWi8kpQAhA-Q');
    expect(isValid).to.be.ok;
  });
});
