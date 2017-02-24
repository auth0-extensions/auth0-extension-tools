const tape = require('tape');

const errors = require('../src/errors');
const extensionTools = require('../src');
const webtaskStorageContext = require('./mocks/webtaskStorageContext');
const BlobRecordProvider = require('../src/blobRecordProvider');

tape('extension-tools should expose the BlobRecordProvider', function(t) {
  t.ok(extensionTools.BlobRecordProvider === BlobRecordProvider);
  t.end();
});

tape('BlobRecordProvider#constructor should throw error if storageContext is not provided', function(t) {
  try {
    const provider = new BlobRecordProvider();
  } catch (e) {
    t.ok(e);
    t.end();
  }
});

tape('BlobRecordProvider#getAll should return all records for a collection', function(t) {
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.getAll('users')
    .then(function(users) {
      t.ok(users);
      t.equal(users.length, 2);
      t.equal(users[1].name, 'Jane');
      t.end();
    });
});

tape('BlobRecordProvider#getAll should return empty array if collection does not exist', function(t) {
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.getAll('someRandomCollection')
    .then(function(data) {
      t.ok(data);
      t.equal(data.length, 0);
      t.end();
    });
});

tape('BlobRecordProvider#get should return a record by its id', function(t) {
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.get('users', 23)
    .then(function(user) {
      t.ok(user);
      t.equal(user.name, 'Jane');
      t.end();
    });
});

tape('BlobRecordProvider#get should return a NotFound error if record does not exist', function(t) {
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.get('users', 545)
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof errors.NotFoundError);
      t.end();
    });
});

tape('BlobRecordProvider#create should add a new record to the collection', function(t) {
  var data = null;
  const context = webtaskStorageContext(function(updatedData) {
    data = updatedData;
  });

  const provider = new BlobRecordProvider(context);
  provider.create('users', { _id: 5, name: 'User 5' })
    .then(function(user) {
      t.ok(user);
      t.equal(user._id, 5);
      t.equal(user.name, 'User 5');
      t.equal(data.users[2], user);
      t.equal(data.users[2]._id, 5);
      t.equal(data.users[2].name, 'User 5');
      t.end();
    });
});

tape('BlobRecordProvider#create should not interact with other collections', function(t) {
  var data = null;
  const context = webtaskStorageContext(function(updatedData) {
    data = updatedData;
  });

  const provider = new BlobRecordProvider(context);
  provider.create('users', { _id: 5, name: 'User 5' })
    .then(function(user) {
      t.ok(user);
      t.equal(data.applications[0]._id, 'a1');
      t.end();
    });
});

tape('BlobRecordProvider#create should generate its own id if not provided', function(t) {
  var data = null;
  const context = webtaskStorageContext(function(updatedData) {
    data = updatedData;
  });

  const provider = new BlobRecordProvider(context);
  provider.create('users', { name: 'User 5' })
    .then(function(user) {
      t.ok(user);
      t.ok(user._id);
      t.equal(user._id.length, 36);
      t.equal(user.name, 'User 5');
      t.equal(data.users[2], user);
      t.equal(data.users[2]._id, user._id);
      t.equal(data.users[2].name, 'User 5');
      t.end();
    });
});

tape('BlobRecordProvider#create should not allow duplicate identifiers', function(t) {
  const data = null;
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.create('users', { _id: 23, name: 'User 5' })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof errors.ValidationError);
      t.end();
    });
});

tape('BlobRecordProvider#create should surface storage errors', function(t) {
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
  provider.create('users', { _id: 50, name: 'User 5' })
    .catch(function(err) {
      t.ok(err);
      t.equal(err.message, 'write_error');
      t.end();
    });
});

tape('BlobRecordProvider#create should perform write retries if storage context supports it', function(t) {
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
  provider.create('users', { _id: 5, name: 'User 5' })
    .then(function(user) {
      t.ok(user);
      t.equal(attempts, 3, '');
      t.end();
    });
});

tape('BlobRecordProvider#update should update records correctly', function(t) {
  var data = null;
  const context = webtaskStorageContext(function(updatedData) {
    data = updatedData;
  });

  const provider = new BlobRecordProvider(context);
  provider.update('users', 23, { name: 'User 6', foo: 'bar' })
    .then(function(user) {
      t.ok(user);
      t.ok(user._id);
      t.equal(user.foo, 'bar');
      t.equal(user.name, 'User 6');
      t.equal(data.users.length, 2);
      t.equal(data.users[1], user);
      t.equal(data.users[1]._id, user._id);
      t.equal(data.users[1].name, 'User 6');
      t.end();
    });
});

tape('BlobRecordProvider#update should upsert records correctly', function(t) {
  var data = null;
  const context = webtaskStorageContext(function(updatedData) {
    data = updatedData;
  });

  const provider = new BlobRecordProvider(context);
  provider.update('users', 24, { name: 'User 6', foo: 'bar' }, true)
    .then(function(user) {
      t.ok(user);
      t.ok(user._id);
      t.equal(user.foo, 'bar');
      t.equal(user.name, 'User 6');
      t.equal(data.users.length, 3);
      t.equal(data.users[2], user);
      t.equal(data.users[2]._id, user._id);
      t.equal(data.users[2].name, 'User 6');
      t.end();
    });
});

tape('BlobRecordProvider#update should surface storage errors', function(t) {
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
  provider.update('users', 24, { name: 'User 6', foo: 'bar' }, true)
    .catch(function(err) {
      t.ok(err);
      t.equal(err.message, 'write_error');
      t.end();
    });
});

tape('BlobRecordProvider#update should throw error if record does not exist', function(t) {
  const data = null;
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.update('users', 24, { name: 'User 6', foo: 'bar' }, false)
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof errors.NotFoundError);
      t.end();
    });
});

tape('BlobRecordProvider#update should perform write retries if storage context supports it', function(t) {
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
  provider.update('users', 23, { name: 'User 6', foo: 'bar' })
    .then(function(user) {
      t.ok(user);
      t.equal(attempts, 3, '');
      t.end();
    });
});

tape('BlobRecordProvider#delete should return true if the record exists', function(t) {
  var data = null;
  const context = webtaskStorageContext(function(updatedData) {
    data = updatedData;
  });

  const provider = new BlobRecordProvider(context);
  provider.delete('users', 23)
    .then(function(deleted) {
      t.ok(deleted);
      t.equal(data.users.length, 1);
      t.equal(data.users[0]._id, 1);
      t.equal(data.users[0].name, 'John');
      t.end();
    });
});

tape('BlobRecordProvider#delete should return false if record does not exist', function(t) {
  const context = webtaskStorageContext();

  const provider = new BlobRecordProvider(context);
  provider.delete('users', 24)
    .then(function(deleted) {
      t.notOk(deleted);
      t.end();
    });
});

tape('BlobRecordProvider#delete should perform write retries if storage context supports it', function(t) {
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
  provider.delete('users', 23)
    .then(function(deleted) {
      t.ok(deleted);
      t.equal(data.users.length, 1);
      t.equal(data.users[0]._id, 1);
      t.equal(data.users[0].name, 'John');
      t.end();
    });
});

tape('BlobRecordProvider#delete should surface storage errors', function(t) {
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
  provider.delete('users', 23)
    .catch(function(err) {
      t.ok(err);
      t.equal(err.message, 'write_error');
      t.end();
    });
});
