const { expect } = require('chai');

const createServer = require('../src/createServer').createServer;
const extensionTools = require('../src');

describe('createServer', function() {
  it('should be exposed in extension-tools', function() {
    expect(extensionTools.createServer).to.equal(createServer);
  });

  it('should get config from the webtask context', function() {
    const server = {};
    const webtaskStorage = {};
    const webtaskContext = { storage: webtaskStorage };
    const serverFactory = createServer(function(config) {
      expect(config, 'Config should be provided').to.be.ok;
      expect(config('HOSTING_ENV')).to.equal('webtask');
      return server;
    });

    serverFactory(webtaskContext);
  });

  it('should get storage from the webtask context', function() {
    const server = {};
    const webtaskStorage = {};
    const webtaskContext = { storage: webtaskStorage };
    const serverFactory = createServer(function(config, storage) {
      expect(storage, 'Storage should be provided').to.be.ok;
      expect(storage, 'Storage should be webtask storage').to.equal(webtaskStorage);
      return server;
    });

    serverFactory(webtaskContext);
  });

  it('should initialize the server once', function() {
    const server = {};
    const webtaskStorage = {};
    const webtaskContext = { storage: webtaskStorage };
    const serverFactory = createServer(function() {
      return server;
    });

    const server1 = serverFactory(webtaskContext);
    const server2 = serverFactory(webtaskContext);

    expect(server1, 'server1 should be server instance returned by the factory').to.equal(server);
    expect(server2, 'Server2 should be the same as server1').to.equal(server);
  });
});
