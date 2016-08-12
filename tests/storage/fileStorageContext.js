const fs = require('fs');
const tape = require('tape');
const path = require('path');
const mock = require('mock-fs');

const FileStorageContext = require('../../src/storage/fileStorageContext');
const extensionTools = require('../../src');

tape('extension-tools should expose the FileStorageContext', function(t) {
  const Ctx = extensionTools.FileStorageContext;
  const ctx = new Ctx('./foo.json');
  t.ok(ctx);
  t.ok(ctx.constructor === FileStorageContext);
  t.end();
});

tape('FileStorageContext#constructor should throw error if path is not provided', function(t) {
  try {
    new FileStorageContext();
  } catch (e) {
    t.ok(e);
    t.end();
  }
});

tape('FileStorageContext#constructor should throw error if path is invalid', function(t) {
  try {
    new FileStorageContext(339);
  } catch (e) {
    t.ok(e);
    t.end();
  }
});

tape('FileStorageContext#read should return defaultData if files does not exist', function(t) {
  const ctx = new FileStorageContext(path.join(__dirname, './data.json'), { mergeWrites: true, defaultData: { foo: 'bar' } });
  ctx.read()
    .then(function(data) {
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'bar');
      t.end();
    });
});

tape('FileStorageContext#read should fallback to empty object if data is empty', function(t) {
  const ctx = new FileStorageContext(path.join(__dirname, './data.json'));
  ctx.read()
    .then(function(data) {
      t.ok(data);
      t.equal(JSON.stringify(data), '{}');
      t.end();
    });
});

tape('FileStorageContext#read should handle errors correctly when read permissions are denied', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: mock.file({
      content: 'file content here',
      mode: 0
    })
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: true, defaultData: { foo: 'bar' } });
  ctx.read()
    .catch(function(err) {
      t.ok(err);
      t.end();
    });
});

tape('FileStorageContext#read should read files correctly', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: '{ "application": "my-app" }'
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: true, defaultData: { foo: 'bar' } });
  ctx.read()
    .then(function(data) {
      t.ok(data);
      t.ok(data.application);
      t.equal(data.application, 'my-app');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#read should return defaultData if file is empty', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: ''
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: true, defaultData: { foo: 'bar' } });
  ctx.read()
    .then(function(data) {
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'bar');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#read should write files correctly', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: '{ "application": "my-app" }'
  });

  const ctx = new FileStorageContext(filePath);
  ctx.write({ application: 'my-new-app' })
    .then(function() {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      t.ok(file);
      t.ok(file.application);
      t.equal(file.application, 'my-new-app');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#read should handle invalid json when reading the file', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: '{ application": "my-app" }'
  });

  const ctx = new FileStorageContext(filePath);
  ctx.read()
    .catch(function(e) {
      t.ok(e);
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#write should merge objects if mergeWrites is true', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: '{ "application": "my-app" }'
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: true });
  ctx.write({ version: '123' })
    .then(function() {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      t.ok(file);
      t.ok(file.application);
      t.equal(file.application, 'my-app');
      t.ok(file.version);
      t.equal(file.version, '123');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#write should merge objects if mergeWrites is true and respect ordering', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: '{ "foo": "bar", "application": "my-app" }'
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: true });
  ctx.write({ version: '123', application: 'my-new-app' })
    .then(function() {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      t.ok(file);
      t.ok(file.foo);
      t.equal(file.foo, 'bar');
      t.ok(file.application);
      t.equal(file.application, 'my-new-app');
      t.ok(file.version);
      t.equal(file.version, '123');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#write should merge objects if mergeWrites is false', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: '{ "application": "my-app" }'
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: false });
  ctx.write({ version: '123' })
    .then(function() {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      t.ok(file);
      t.notOk(file.application);
      t.ok(file.version);
      t.equal(file.version, '123');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#write should handle errors correctly when writing problematic objects', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: mock.file({
      content: '{ "application": "my-app" }',
      mode: 256
    })
  });

  const a = { foo: 'bar' };
  const b = { bar: 'foo' };

  a.b = b;
  b.a = a;

  const ctx = new FileStorageContext(filePath, { mergeWrites: true });
  ctx.write({ a: a, b: b })
    .catch(function(err) {
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'TypeError');
      t.end();
      mock.restore();
    });
});

tape('FileStorageContext#write should handle errors correctly when write permissions are denied', function(t) {
  const filePath = path.join(__dirname, './data.json');
  mock({
    [filePath]: mock.file({
      content: '{ "application": "my-app" }',
      mode: 256
    })
  });

  const ctx = new FileStorageContext(filePath, { mergeWrites: true });
  ctx.write({ version: '123' })
    .catch(function(err) {
      t.ok(err);
      t.end();
      mock.restore();
    });
});
