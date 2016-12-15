const _ = require('lodash');
const uuid = require('node-uuid');
const promiseRetry = require('promise-retry');
const ArgumentError = require('./errors').ArgumentError;
const NotFoundError = require('./errors').NotFoundError;
const ValidationError = require('./errors').ValidationError;

const getDataForCollection = function(storageContext, collectionName) {
  return storageContext.read(collectionName)
    .then(function(data) {
      data[collectionName] = data[collectionName] || [];
      return data;
    });
};

const retryAction = function(storageContext, action) {
  const retryOptions = {
    retries: 10,
    factor: 2,
    minTimeout: 100,
    maxTimeout: Infinity,
    randomize: false
  };

  return promiseRetry(function(retry, number) {
    console.log('Retry attempt', number);

    return action()
      .catch(function(err) {
        const writeRetryCondition =
          storageContext.writeRetryCondition ||
          function() { return false; };
        if (writeRetryCondition(err)) {
          return retry(err);
        }

        throw err;
      });
  }, retryOptions);
};

/**
 * Create a new BlobRecordProvider.
 * @param {Object} storageContext The storage context.
 * @constructor
 */
function BlobRecordProvider(storageContext) {
  if (storageContext === null || storageContext === undefined) {
    throw new ArgumentError('Must provide a storage context');
  }

  this.storageContext = storageContext;
}

/**
 * Get all records for a collection.
 * @param {string} collectionName The name of the collection.
 * @return {Array} The records.
 */
BlobRecordProvider.prototype.getAll = function(collectionName) {
  return getDataForCollection(this.storageContext, collectionName)
    .then(function(data) {
      return data[collectionName];
    });
};

/**
 * Get a single record from a collection.
 * @param {string} collectionName The name of the collection.
 * @param {string} identifier The identifier of the record.
 * @return {Object} The record.
 */
BlobRecordProvider.prototype.get = function(collectionName, identifier) {
  return this.getAll(collectionName)
    .then(function(records) {
      const record = _.find(records, function(r) { return r._id === identifier });
      if (!record) {
        return Promise.reject(
          new NotFoundError('The record ' + identifier + ' in ' + collectionName + ' does not exist.')
        );
      }

      return record;
    });
};

/**
 * Create a record in a collection.
 * @param {string} collectionName The name of the collection.
 * @param {Object} record The record.
 * @return {Object} The record.
 */
BlobRecordProvider.prototype.create = function(collectionName, record) {
  const storageContext = this.storageContext;
  const action = function() {
    return getDataForCollection(storageContext, collectionName)
      .then(function(data) {
        if (!record._id) {
          record._id = uuid.v4();
        }

        const index = _.findIndex(data[collectionName], function(r) { return r._id === record._id; });
        if (index > -1) {
          return Promise.reject(
            new ValidationError('The record ' + record._id + ' in ' + collectionName + ' already exists.')
          );
        }

        // Add to dataset.
        data[collectionName].push(record);

        // Save.
        return storageContext.write(data)
          .then(function() {
            return record;
          });
      });
  };

  return retryAction(storageContext, action);
};

/**
 * Update a record in a collection.
 * @param {string} collectionName The name of the collection.
 * @param {string} identifier The identifier of the record to update.
 * @param {Object} record The record.
 * @param {boolean} upsert Flag allowing to upsert if the record does not exist.
 * @return {Object} The record.
 */
BlobRecordProvider.prototype.update = function(collectionName, identifier, record, upsert) {
  const storageContext = this.storageContext;
  const action = function() {
    return getDataForCollection(storageContext, collectionName)
      .then(function(data) {
        const index = _.findIndex(data[collectionName], function(r) { return r._id === identifier; });
        if (index < 0 && !upsert) {
          throw new NotFoundError('The record ' + identifier + ' in ' + collectionName + ' does not exist.');
        }

        // Update record.
        const updatedRecord = _.extend({ _id: identifier }, index < 0 ? { } : data[collectionName][index], record);
        if (index < 0) {
          data[collectionName].push(updatedRecord);
        } else {
          data[collectionName][index] = updatedRecord;
        }

        // Save.
        return storageContext.write(data)
          .then(function() {
            return updatedRecord;
          });
      });
  };

  return retryAction(storageContext, action);
};

/**
 * Delete a record in a collection.
 * @param {string} collectionName The name of the collection.
 * @param {string} identifier The identifier of the record to update.
 */
BlobRecordProvider.prototype.delete = function(collectionName, identifier) {
  const storageContext = this.storageContext;
  const action = function() {
    return getDataForCollection(storageContext, collectionName)
      .then(function(data) {
        const index = _.findIndex(data[collectionName], function(r) { return r._id === identifier; });
        if (index < 0) {
          return false;
        }

        // Remove the record.
        data[collectionName].splice(index, 1);

        // Save.
        return storageContext.write(data)
          .then(function() {
            return true;
          });
      });
  };

  return retryAction(storageContext, action);
};

/**
 * Module exports.
 * @type {function}
 */
module.exports = BlobRecordProvider;
