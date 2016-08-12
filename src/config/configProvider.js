const _ = require('lodash');
const ArgumentError = require('../errors').ArgumentError;

module.exports.fromWebtaskContext = function(webtaskContext) {
  if (webtaskContext === null || webtaskContext === undefined) {
    throw new ArgumentError('Must provide a webtask context');
  }

  const settings = _.assign({ }, process.env, webtaskContext.params, webtaskContext.secrets, {
    NODE_ENV: 'production',
    HOSTING_ENV: 'webtask'
  });

  return function getSettings(key) {
    return settings[key];
  };
};
