const tape = require('tape');

const webtaskStorage = require('../mocks/webtaskStorage');
const extensionTools = require('../../src');
const WebtaskStorageContext = require('../../src/storage/webtaskStorageContext');

tape('extension-tools should expose the WebtaskStorageContext', function(t) {
  const storage = webtaskStorage(null);
  const Ctx = extensionTools.WebtaskStorageContext;
  const ctx = new Ctx(storage);
  t.ok(ctx);
  t.ok(ctx.constructor === WebtaskStorageContext);
  t.end();
});

tape('WebtaskStorageContext#constructor should throw error if storage object is not provided', function(t) {
  try {
    const ctx = new WebtaskStorageContext();
  } catch (e) {
    t.ok(e);
    t.end();
  }
});

tape('WebtaskStorageContext#constructor should return defaultData if data from webtask is null', function(t) {
  const storage = webtaskStorage(null);

  const ctx = new WebtaskStorageContext(storage, { defaultData: { foo: 'bar' } });
  ctx.read()
    .then(function(data) {
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'bar');
      t.end();
    });
});

tape('WebtaskStorageContext#read should read storage correctly', function(t) {
  const storage = webtaskStorage({ foo: 'other-bar' });

  const ctx = new WebtaskStorageContext(storage, { defaultData: { foo: 'bar' } });
  ctx.read()
    .then(function(data) {
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'other-bar');
      t.end();
    });
});

tape('WebtaskStorageContext#read should handle errors correctly when reading fails', function(t) {
  const storage = webtaskStorage(new Error('foo'));

  const ctx = new WebtaskStorageContext(storage);
  ctx.read()
    .catch(function(err) {
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'Error');
      t.end();
    });
});

tape('WebtaskStorageContext#write should write files correctly', function(t) {
  var data = null;
  const storage = webtaskStorage({ application: 'my-app' }, function(updatedData) {
    data = updatedData;
  });

  const ctx = new WebtaskStorageContext(storage);
  ctx.write({ application: 'my-new-app' })
    .then(function() {
      t.ok(data);
      t.ok(data.application);
      t.equal(data.application, 'my-new-app');
      t.end();
    });
});

// FIXME: This test wasn't working. The caught error was not coming from the problematic object, but from the missing onDataChanged function
//        which the mock webtaskStorage module now handles without throwing an error.
tape.skip('WebtaskStorageContext#write should handle errors correctly when writing problematic objects', function(t) {
  const storage = webtaskStorage({ });

  const a = { foo: 'bar' };
  const b = { bar: 'foo' };

  a.b = b;
  b.a = a;

  const ctx = new WebtaskStorageContext(storage);
  ctx.write({ a: a, b: b })
    .catch(function(err) {
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'TypeError');
      t.end();
    });
});

tape('WebtaskStorageContext#write should handle errors correctly when writing fails', function(t) {
  const storage = webtaskStorage(new Error('foo'));

  const ctx = new WebtaskStorageContext(storage);
  ctx.write({ foo: 'bar' })
    .catch(function(err) {
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'Error');
      t.end();
    });
});
