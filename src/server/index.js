const configProvider = require('../config/configProvider');

module.exports.createServer = function(cb) {
  var server = null;

  return function requestHandler(req, res) {
    if (!server) {
      const config = configProvider.fromWebtaskContext(req.webtaskContext);
      server = cb(req, config, req.webtaskContext.storage);
    }

    return server(req, res);
  };
};
