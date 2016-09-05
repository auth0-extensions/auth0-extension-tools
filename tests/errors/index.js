const tape = require('tape');

const extensionTools = require('../../src');

tape('extension-tools should expose all errors', function(t) {
  t.ok(extensionTools.ArgumentError);
  t.ok(extensionTools.ForbiddenError);
  t.ok(extensionTools.HookTokenError);
  t.ok(extensionTools.ManagementApiError);
  t.ok(extensionTools.NotFoundError);
  t.ok(extensionTools.UnauthorizedError);
  t.ok(extensionTools.ValidationError);
  t.end();
});
