const webtaskStorage = require('../mocks/webtaskStorage');
const WebtaskStorageContext = require('../../src/storage/webtaskStorageContext');

module.exports = function(onDataChanged) {
  const data = {
    applications: [
      { _id: 'a1', name: 'a1' }
    ],
    users: [
      { _id: 1, name: 'John' },
      { _id: 23, name: 'Jane' }
    ]
  };

  const storage = webtaskStorage(data, onDataChanged);
  return new WebtaskStorageContext(storage);
};
