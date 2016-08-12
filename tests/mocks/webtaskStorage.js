const _ = require('lodash');

module.exports = function(data, onDataChanged) {
  var webtaskData = data;
  return {
    get: function(cb) {
      if (data && data.name === 'Error') {
        return cb(data);
      }
      return cb(null, webtaskData);
    },
    set: function(newData, opt, cb) {
      if (data && data.name === 'Error') {
        return cb(data);
      }

      webtaskData = _.extend({ }, webtaskData, newData);
      onDataChanged(webtaskData);
      return cb();
    }
  };
};
