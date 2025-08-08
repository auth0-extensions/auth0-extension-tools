const fs = require('fs');
const { expect } = require('chai');
const path = require('path');
const mock = require('mock-fs');

const FileStorageContext = require('../../src/storage/fileStorageContext');
const extensionTools = require('../../src');

describe('FileStorageContext', function() {
  it('should expose the FileStorageContext in extension-tools', function() {
    const Ctx = extensionTools.FileStorageContext;
    const ctx = new Ctx('./foo.json');
    expect(ctx).to.be.ok;
    expect(ctx.constructor).to.equal(FileStorageContext);
  });

  it('should throw error if path is not provided in constructor', function() {
    expect(function() {
      new FileStorageContext();
    }).to.throw();
  });

  it('should throw error if path is invalid in constructor', function() {
    expect(function() {
      new FileStorageContext(339);
    }).to.throw();
  });

  it('should return defaultData if file does not exist', function() {
    const ctx = new FileStorageContext(path.join(__dirname, './data.json'), { mergeWrites: true, defaultData: { foo: 'bar' } });
    return ctx.read()
      .then(function(data) {
        expect(data).to.be.ok;
        expect(data.foo).to.be.ok;
        expect(data.foo).to.equal('bar');
      });
  });

  it('should fallback to empty object if data is empty', function() {
    const ctx = new FileStorageContext(path.join(__dirname, './data.json'));
    return ctx.read()
      .then(function(data) {
        expect(data).to.be.ok;
        expect(JSON.stringify(data)).to.equal('{}');
      });
  });

  it('should handle errors correctly when read permissions are denied', function() {
    const filePath = path.join(__dirname, './data.json');

    mock({
      [filePath]: mock.file({
        content: 'file content here',
        mode: 0
      })
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: true, defaultData: { foo: 'bar' } });

    return ctx.read()
      .then(function() {
        throw new Error('Should have thrown an error');
      })
      .catch(function(err) {
        mock.restore();
        expect(err).to.be.ok;
      });
  });

  it('should read files correctly', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: '{ "application": "my-app" }'
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: true, defaultData: { foo: 'bar' } });
    return ctx.read()
      .then(function(data) {
        mock.restore();
        expect(data).to.be.ok;
        expect(data.application).to.be.ok;
        expect(data.application).to.equal('my-app');
      });
  });

  it('should return defaultData if file is empty', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: ''
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: true, defaultData: { foo: 'bar' } });
    return ctx.read()
      .then(function(data) {
        mock.restore();
        expect(data).to.be.ok;
        expect(data.foo).to.be.ok;
        expect(data.foo).to.equal('bar');
      });
  });

  it('should write files correctly', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: '{ "application": "my-app" }'
    });

    const ctx = new FileStorageContext(filePath);
    return ctx.write({ application: 'my-new-app' })
      .then(function() {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        mock.restore();
        expect(file).to.be.ok;
        expect(file.application).to.be.ok;
        expect(file.application).to.equal('my-new-app');
      });
  });

  it('should handle invalid json when reading the file', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: '{ application": "my-app" }'
    });

    const ctx = new FileStorageContext(filePath);
    return ctx.read()
      .then(function() {
        throw new Error('Should have thrown an error');
      })
      .catch(function(e) {
        mock.restore();
        expect(e).to.be.ok;
      });
  });

  it('should merge objects if mergeWrites is true', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: '{ "application": "my-app" }'
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: true });
    return ctx.write({ version: '123' })
      .then(function() {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        mock.restore();
        expect(file).to.be.ok;
        expect(file.application).to.be.ok;
        expect(file.application).to.equal('my-app');
        expect(file.version).to.be.ok;
        expect(file.version).to.equal('123');
      });
  });

  it('should merge objects if mergeWrites is true and respect ordering', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: '{ "foo": "bar", "application": "my-app" }'
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: true });
    return ctx.write({ version: '123', application: 'my-new-app' })
      .then(function() {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        mock.restore();
        expect(file).to.be.ok;
        expect(file.foo).to.be.ok;
        expect(file.foo).to.equal('bar');
        expect(file.application).to.be.ok;
        expect(file.application).to.equal('my-new-app');
        expect(file.version).to.be.ok;
        expect(file.version).to.equal('123');
      });
  });

  it('should not merge objects if mergeWrites is false', function() {
    const filePath = path.join(__dirname, './data.json');
    mock({
      [filePath]: '{ "application": "my-app" }'
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: false });
    return ctx.write({ version: '123' })
      .then(function() {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        mock.restore();
        expect(file).to.be.ok;
        expect(file.application).to.not.be.ok;
        expect(file.version).to.be.ok;
        expect(file.version).to.equal('123');
      });
  });

  it('should handle errors correctly when writing problematic objects', function() {
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
    return ctx.write({ a: a, b: b })
      .then(function() {
        throw new Error('Should have thrown an error');
      })
      .catch(function(err) {
        mock.restore();
        expect(err).to.be.ok;
        expect(err.name).to.be.ok;
        expect(err.name).to.equal('TypeError');
      });
  });

  it('should handle errors correctly when write permissions are denied', function() {
    // mock-fs and permissions seem to have issues when running in docker
    if (fs.existsSync('/.dockerenv')) {
      return;
    }

    const filePath = '/foo/bar.json';
    mock({
      [filePath]: mock.file({
        content: '{ "application": "my-app" }',
        mode: 256
      })
    });

    const ctx = new FileStorageContext(filePath, { mergeWrites: true });
    return ctx.write({ version: '123' })
      .then(function() {
        throw new Error('Should not write the file.');
      })
      .catch(function(err) {
        mock.restore();
        expect(err, 'should throw error').to.be.ok;
      });
  });
});
