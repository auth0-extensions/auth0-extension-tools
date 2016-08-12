const tape = require('tape');

const createServer = require('../../src/server').createServer;
const extensionTools = require('../../src');

tape('extension-tools should expose createServer', function(t) {
  t.ok(extensionTools.createServer === createServer);
  t.end();
});

tape('server#createServer should initialize the server once', function(t) {
  var initializationCount = 0;
  var requestCount = 0;
  const server = function(req) {
    requestCount++;
  };
  const requestHandler = createServer(function(req, config, storage) {
    t.ok(config, 'Config should be provided');
    t.equal(config('HOSTING_ENV'), 'webtask');
    t.ok(storage, 'Storage should be provided');
    initializationCount++;
    return server;
  });

  const req = {
    webtaskContext: {
      params: { },
      secrets: { },
      storage: { }
    }
  };
  const res = { };
  requestHandler(req, res);
  requestHandler(req, res);
  requestHandler(req, res);

  t.equal(initializationCount, 1, 'Server should only be initialized once');
  t.equal(requestCount, 3, 'Every request should be processed');
  t.end();
});
