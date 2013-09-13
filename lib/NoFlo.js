(function() {
  exports.graph = require('./Graph');

  exports.Graph = exports.graph.Graph;

  exports.Network = require('./Network').Network;

  exports.isBrowser = function() {
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return false;
    }
    return true;
  };

  if (!exports.isBrowser()) {
    exports.ComponentLoader = require('./nodejs/ComponentLoader').ComponentLoader;
  } else {
    exports.ComponentLoader = require('./ComponentLoader').ComponentLoader;
  }

  exports.Component = require('./Component').Component;

  exports.AsyncComponent = require('./AsyncComponent').AsyncComponent;

  exports.LoggingComponent = require('./LoggingComponent').LoggingComponent;

  exports.Port = require('./Port').Port;

  exports.ArrayPort = require('./ArrayPort').ArrayPort;

  exports.internalSocket = require('./InternalSocket');

  exports.createNetwork = function(graph, callback, delay) {
    var network, networkReady;
    network = new exports.Network(graph);
    networkReady = function(network) {
      if (callback != null) {
        callback(network);
      }
      return network.sendInitials();
    };
    if (graph.nodes.length === 0) {
      setTimeout(function() {
        return networkReady(network);
      }, 0);
      return network;
    }
    network.loader.listComponents(function() {
      if (delay) {
        if (callback != null) {
          callback(network);
        }
        return;
      }
      return network.connect(function() {
        return networkReady(network);
      });
    });
    return network;
  };

  exports.loadFile = function(file, callback) {
    return exports.graph.loadFile(file, function(net) {
      return exports.createNetwork(net, callback);
    });
  };

  exports.saveFile = function(graph, file, callback) {
    return exports.graph.save(file, function() {
      return callback(file);
    });
  };

}).call(this);
