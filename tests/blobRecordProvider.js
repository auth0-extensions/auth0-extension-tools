const { expect } = require('chai');

const errors = require('../src/errors');
const extensionTools = require('../src');
const webtaskStorageContext = require('./mocks/webtaskStorageContext');
const BlobRecordProvider = require('../src/blobRecordProvider');

describe('BlobRecordProvider', function() {
  it('should expose the BlobRecordProvider in extension-tools', function() {
    expect(extensionTools.BlobRecordProvider === BlobRecordProvider).to.be.ok;
  });

  it('should throw error if storageContext is not provided', function() {
    expect(() => new BlobRecordProvider()).to.throw();
  });

  it('should return all records for a collection', function() {
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.getAll('users')
      .then(function(users) {
        expect(users).to.be.ok;
        expect(users.length).to.equal(2);
        expect(users[1].name).to.equal('Jane');
      });
  });

  it('should return empty array if collection does not exist', function() {
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.getAll('someRandomCollection')
      .then(function(data) {
        expect(data).to.be.ok;
        expect(data.length).to.equal(0);
      });
  });

  it('should return a record by its id', function() {
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.get('users', 23)
      .then(function(user) {
        expect(user).to.be.ok;
        expect(user.name).to.equal('Jane');
      });
  });

  it('should return a NotFound error if record does not exist', function() {
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.get('users', 545)
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.be.instanceOf(errors.NotFoundError);
      });
  });

  it('should add a new record to the collection', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context);
    return provider.create('users', { _id: 5, name: 'User 5' })
      .then(function(user) {
        expect(user).to.be.ok;
        expect(user._id).to.equal(5);
        expect(user.name).to.equal('User 5');
        expect(data.users[2]).to.equal(user);
        expect(data.users[2]._id).to.equal(5);
        expect(data.users[2].name).to.equal('User 5');
      });
  });

  it('should support queueing of write requests', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context, { concurrentWrites: false });

    const userCount = Array.from(Array(1000).keys());
    return Promise.map(userCount, function(currentUser) {
      return provider.create('bulkusers', { _id: currentUser, name: 'User ' + currentUser });
    })
    .then(function() {
      expect(data.bulkusers.length).to.equal(1000);
    });
  });

  it('should not work correctly when concurrent writes are enabled for bulk operations', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context, { concurrentWrites: true });

    const userCount = Array.from(Array(1000).keys());
    return Promise.map(userCount, function(currentUser) {
      return provider.create('bulkusers', { _id: currentUser, name: 'User ' + currentUser });
    })
    .then(function() {
      expect(data.bulkusers.length).to.be.below(1000);
    });
  });

  it('should not interact with other collections', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context);
    return provider.create('users', { _id: 5, name: 'User 5' })
      .then(function(user) {
        expect(user).to.be.ok;
        expect(data.applications[0]._id).to.equal('a1');
      });
  });

  it('should generate its own id if not provided', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context);
    return provider.create('users', { name: 'User 5' })
      .then(function(user) {
        expect(user).to.be.ok;
        expect(user._id).to.be.ok;
        expect(user._id.length).to.equal(36);
        expect(user.name).to.equal('User 5');
        expect(data.users[2]).to.equal(user);
        expect(data.users[2]._id).to.equal(user._id);
        expect(data.users[2].name).to.equal('User 5');
      });
  });

  it('should not allow duplicate identifiers', function() {
    const data = null;
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.create('users', { _id: 23, name: 'User 5' })
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.be.instanceOf(errors.ValidationError);
      });
  });

  it('should surface storage errors', function() {
    var data = null;
    const context = webtaskStorageContext(
      function(updatedData) {
        data = updatedData;
      },
      function() {
        return new Error('write_error');
      }
    );

    const provider = new BlobRecordProvider(context);
    return provider.create('users', { _id: 50, name: 'User 5' })
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('write_error');
      });
  });

  it('should perform write retries if storage context supports it', function() {
    var data = null;
    var attempts = 0;
    const context = webtaskStorageContext(
      function(updatedData) {
        data = updatedData;
      },
      function() {
        attempts++;

        if (attempts < 3) {
          const error = new Error('Write conflict!');
          error.code = 409;
          return error;
        }
      }
    );

    const provider = new BlobRecordProvider(context);
    return provider.create('users', { _id: 5, name: 'User 5' })
      .then(function(user) {
        expect(user).to.be.ok;
        expect(attempts).to.equal(3);
      });
  });

  it('should update records correctly', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context);
    return provider.update('users', 23, { name: 'User 6', foo: 'bar' })
      .then(function(user) {
        expect(user).to.be.ok;
        expect(user._id).to.be.ok;
        expect(user.foo).to.equal('bar');
        expect(user.name).to.equal('User 6');
        expect(data.users.length).to.equal(2);
        expect(data.users[1]).to.equal(user);
        expect(data.users[1]._id).to.equal(user._id);
        expect(data.users[1].name).to.equal('User 6');
      });
  });

  it('should support queueing of write requests for updates', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context, { concurrentWrites: false });

    const userCount = Array.from(Array(100).keys());
    return Promise.map(userCount, function(currentUser) {
      return provider.update('bulkusers', currentUser, { _id: currentUser, name: 'User ' + currentUser }, true);
    })
    .then(function() {
      expect(data.bulkusers.length).to.equal(100);
    });
  });

  it('should upsert records correctly', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context);
    return provider.update('users', 24, { name: 'User 6', foo: 'bar' }, true)
      .then(function(user) {
        expect(user).to.be.ok;
        expect(user._id).to.be.ok;
        expect(user.foo).to.equal('bar');
        expect(user.name).to.equal('User 6');
        expect(data.users.length).to.equal(3);
        expect(data.users[2]).to.equal(user);
        expect(data.users[2]._id).to.equal(user._id);
        expect(data.users[2].name).to.equal('User 6');
      });
  });

  it('should surface storage errors on update', function() {
    var data = null;
    const context = webtaskStorageContext(
      function(updatedData) {
        data = updatedData;
      },
      function() {
        return new Error('write_error');
      }
    );

    const provider = new BlobRecordProvider(context);
    return provider.update('users', 24, { name: 'User 6', foo: 'bar' }, true)
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('write_error');
      });
  });

  it('should throw error if record does not exist on update', function() {
    const data = null;
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.update('users', 24, { name: 'User 6', foo: 'bar' }, false)
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.be.instanceOf(errors.NotFoundError);
      });
  });

  it('should perform write retries if storage context supports it for updates', function() {
    var data = null;
    var attempts = 0;
    const context = webtaskStorageContext(
      function(updatedData) {
        data = updatedData;
      },
      function() {
        attempts++;

        if (attempts < 3) {
          const error = new Error('Write conflict!');
          error.code = 409;
          return error;
        }
      }
    );

    const provider = new BlobRecordProvider(context);
    return provider.update('users', 23, { name: 'User 6', foo: 'bar' })
      .then(function(user) {
        expect(user).to.be.ok;
        expect(attempts).to.equal(3);
      });
  });

  it('should return true if the record exists when deleting', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context);
    return provider.delete('users', 23)
      .then(function(deleted) {
        expect(deleted).to.be.ok;
        expect(data.users.length).to.equal(1);
        expect(data.users[0]._id).to.equal(1);
        expect(data.users[0].name).to.equal('John');
      });
  });

  it('should return false if record does not exist when deleting', function() {
    const context = webtaskStorageContext();

    const provider = new BlobRecordProvider(context);
    return provider.delete('users', 24)
      .then(function(deleted) {
        expect(deleted).to.not.be.ok;
      });
  });

  it('should perform write retries if storage context supports it for deletes', function() {
    var data = null;
    var attempts = 0;
    const context = webtaskStorageContext(
      function(updatedData) {
        data = updatedData;
      },
      function() {
        attempts++;

        if (attempts < 3) {
          const error = new Error('Write conflict!');
          error.code = 409;
          return error;
        }
      }
    );

    const provider = new BlobRecordProvider(context);
    return provider.delete('users', 23)
      .then(function(deleted) {
        expect(deleted).to.be.ok;
        expect(data.users.length).to.equal(1);
        expect(data.users[0]._id).to.equal(1);
        expect(data.users[0].name).to.equal('John');
      });
  });

  it('should surface storage errors on delete', function() {
    var data = null;
    const context = webtaskStorageContext(
      function(updatedData) {
        data = updatedData;
      },
      function() {
        return new Error('write_error');
      }
    );

    const provider = new BlobRecordProvider(context);
    return provider.delete('users', 23)
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('write_error');
      });
  });

  it('should support queueing of write requests for complex operations', function() {
    var data = null;
    const context = webtaskStorageContext(function(updatedData) {
      data = updatedData;
    });

    const provider = new BlobRecordProvider(context, { concurrentWrites: false });

    const userCount = Array.from(Array(100).keys());
    return Promise.map(userCount, function(currentUser) {
      return provider.create('bulkusers', { _id: currentUser + 1, name: 'User ' + currentUser });
    })
    .then(function() {
      expect(data.bulkusers.length).to.equal(100);
      return Promise.map(userCount, function(currentUser) {
        return provider.update('bulkusers', currentUser + 1, { name: 'User Updated ' + currentUser });
      });
    })
    .then(function() {
      expect(data.bulkusers.length).to.equal(100);
      return Promise.map(userCount, function(currentUser) {
        return provider.delete('bulkusers', currentUser + 1);
      });
    })
    .then(function() {
      expect(data.bulkusers.length).to.equal(0);
    });
  });
});
