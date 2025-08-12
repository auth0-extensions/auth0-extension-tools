module.exports = function(data, onDataChanged, beforeDataChanged) {
  var webtaskData = data;
  return {
    get: function(cb) {
      if (data && data.name === 'Error') {
        return cb(data);
      }
      return cb(null, JSON.parse(JSON.stringify(webtaskData)));
    },
    set: function(newData, opt, cb) {
      if (data && data.name === 'Error') {
        return cb(data);
      }

      try {
        JSON.stringify(newData, null, 2);
      } catch (e) {
        return cb(e);
      }

      if (beforeDataChanged) {
        const error = beforeDataChanged();
        if (error) {
          return cb(error);
        }
      }

      webtaskData = newData;
      if (onDataChanged) {
        onDataChanged(webtaskData);
      }

      return setTimeout(cb, 5);
    }
  };
};
