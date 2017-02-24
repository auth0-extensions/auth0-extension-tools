const tape = require('tape');

const createServer = require('../src/createServer').createServer;
const extensionTools = require('../src');

tape('extension-tools should expose createServer', function(t) {
  t.ok(extensionTools.createServer === createServer);
  t.end();
});

tape('server#createServer should get config from the webtask context', function(t) {
  const server = {};
  const webtaskStorage = {};
  const webtaskContext = { storage: webtaskStorage };
  const serverFactory = createServer(function(config) {
    t.ok(config, 'Config should be provided');
    t.equal(config('HOSTING_ENV'), 'webtask');
    return server;
  });

  serverFactory(webtaskContext);
  t.end();
});

tape('server#createServer should get storage from the webtask context', function(t) {
  const server = {};
  const webtaskStorage = {};
  const webtaskContext = { storage: webtaskStorage };
  const serverFactory = createServer(function(config, storage) {
    t.ok(storage, 'Storage should be provided');
    t.equal(storage, webtaskStorage, 'Storage should be webtask storage');
    return server;
  });

  serverFactory(webtaskContext);
  t.end();
});

tape('server#createServer should initialize the server once', function(t) {
  const server = {};
  const webtaskStorage = {};
  const webtaskContext = { storage: webtaskStorage };
  const serverFactory = createServer(function() {
    return server;
  });

  const server1 = serverFactory(webtaskContext);
  const server2 = serverFactory(webtaskContext);

  t.equal(server1, server, 'server1 should be server instance returned by the factory');
  t.equal(server2, server, 'Server2 should be the same as server1');
  t.end();
});
