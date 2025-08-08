const { expect } = require('chai');

const extensionTools = require('../../src');

describe('Error exports', function() {
  it('should expose all errors in extension-tools', function() {
    expect(extensionTools.ArgumentError).to.be.ok;
    expect(extensionTools.ForbiddenError).to.be.ok;
    expect(extensionTools.HookTokenError).to.be.ok;
    expect(extensionTools.ManagementApiError).to.be.ok;
    expect(extensionTools.NotFoundError).to.be.ok;
    expect(extensionTools.UnauthorizedError).to.be.ok;
    expect(extensionTools.ValidationError).to.be.ok;
  });
});
