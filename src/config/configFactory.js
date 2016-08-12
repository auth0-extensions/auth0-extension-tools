module.exports = function() {
  var currentProvider = null;

  const config = function(key) {
    if (!currentProvider) {
      throw new Error('A configuration provider has not been set');
    }

    return currentProvider(key);
  };

  config.setProvider = function(providerFunction) {
    currentProvider = providerFunction;
  };

  return config;
};
