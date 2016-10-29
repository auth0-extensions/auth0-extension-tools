const tape = require('tape');

const extensionTools = require('../src');
const HookTokenError = require('../src/errors').HookTokenError;
const validateHookToken = require('../src/validateHookToken');

tape('extension-tools should expose validateHookToken', function(t) {
  t.ok(extensionTools.validateHookToken === validateHookToken);
  t.end();
});

tape('validateHookToken should require a token', function(t) {
  try {
    validateHookToken();
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof HookTokenError);
    t.end();
  }
});

tape('validateHookToken reject invalid tokens', function(t) {
  try {
    validateHookToken('me.auth0.com', 'https://webtask.io/run/abc', '/extension/uninstall', 'mysecret', 'faketoken');
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof HookTokenError);
    t.ok(e.innerError);
    t.end();
  }
});

tape('validateHookToken accept valid tokens', function(t) {
  const isValid = validateHookToken('me.auth0.com', 'https://webtask.io/run/abc', '/extension/uninstall', 'mysecret',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL21lLmF1dGgwLmNvbSIsImF1ZCI6Imh0dHBzOi8vd2VidGFzay5pby9ydW4vYWJjL2V4dGVuc2lvbi91bmluc3RhbGwifQ.fdAaM7cLdirmv4KyQ46Vq4eat04gRb7KWi8kpQAhA-Q');
  t.ok(isValid);
  t.end();
});
