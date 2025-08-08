const { expect } = require('chai');

const webtaskStorage = require('../mocks/webtaskStorage');
const extensionTools = require('../../src');
const WebtaskStorageContext = require('../../src/storage/webtaskStorageContext');

describe('WebtaskStorageContext', function() {
  it('should be exposed in extension-tools', function() {
    const storage = webtaskStorage(null);
    const Ctx = extensionTools.WebtaskStorageContext;
    const ctx = new Ctx(storage);
    expect(ctx).to.be.ok;
    expect(ctx.constructor).to.equal(WebtaskStorageContext);
  });

  it('should throw error if storage object is not provided in constructor', function() {
    expect(function() {
      const ctx = new WebtaskStorageContext();
    }).to.throw();
  });

  it('should return defaultData if data from webtask is null', function() {
    const storage = webtaskStorage(null);

    const ctx = new WebtaskStorageContext(storage, { defaultData: { foo: 'bar' } });
    return ctx.read()
      .then(function(data) {
        expect(data).to.be.ok;
        expect(data.foo).to.be.ok;
        expect(data.foo).to.equal('bar');
      });
  });

  it('should read storage correctly', function() {
    const storage = webtaskStorage({ foo: 'other-bar' });

    const ctx = new WebtaskStorageContext(storage, { defaultData: { foo: 'bar' } });
    return ctx.read()
      .then(function(data) {
        expect(data).to.be.ok;
        expect(data.foo).to.be.ok;
        expect(data.foo).to.equal('other-bar');
      });
  });

  it('should handle errors correctly when reading fails', function() {
    const storage = webtaskStorage(new Error('foo'));

    const ctx = new WebtaskStorageContext(storage);
    return ctx.read()
      .then(function() {
        throw new Error('Should have thrown an error');
      })
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.name).to.be.ok;
        expect(err.name).to.equal('Error');
      });
  });

  it('should write files correctly', function() {
    var data = null;
    const storage = webtaskStorage({ application: 'my-app' }, function(updatedData) {
      data = updatedData;
    });

    const ctx = new WebtaskStorageContext(storage);
    return ctx.write({ application: 'my-new-app' })
      .then(function() {
        expect(data).to.be.ok;
        expect(data.application).to.be.ok;
        expect(data.application).to.equal('my-new-app');
      });
  });

  it('should handle errors correctly when writing problematic objects', function() {
    const storage = webtaskStorage({ });

    const a = { foo: 'bar' };
    const b = { bar: 'foo' };

    a.b = b;
    b.a = a;

    const ctx = new WebtaskStorageContext(storage);
    return ctx.write({ a: a, b: b })
      .then(function() {
        throw new Error('Should have thrown an error');
      })
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.name).to.be.ok;
        expect(err.name).to.equal('TypeError');
      });
  });

  it('should handle errors correctly when writing fails', function() {
    const storage = webtaskStorage(new Error('foo'));

    const ctx = new WebtaskStorageContext(storage);
    return ctx.write({ foo: 'bar' })
      .then(function() {
        throw new Error('Should have thrown an error');
      })
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.name).to.be.ok;
        expect(err.name).to.equal('Error');
      });
  });
});
