(function() {
  var EventEmitter, Network, componentLoader, graph, internalSocket, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("underscore");

  internalSocket = require("./InternalSocket");

  graph = require("./Graph");

  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    componentLoader = require("./nodejs/ComponentLoader");
    EventEmitter = require('events').EventEmitter;
  } else {
    componentLoader = require('./ComponentLoader');
    EventEmitter = require('emitter');
  }

  Network = (function(_super) {
    __extends(Network, _super);

    Network.prototype.processes = {};

    Network.prototype.connections = [];

    Network.prototype.initials = [];

    Network.prototype.graph = null;

    Network.prototype.startupDate = null;

    Network.prototype.portBuffer = {};

    function Network(graph) {
      var _this = this;
      this.processes = {};
      this.connections = [];
      this.initials = [];
      this.graph = graph;
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        this.baseDir = graph.baseDir || process.cwd();
      } else {
        this.baseDir = graph.baseDir || '/';
      }
      this.startupDate = new Date();
      this.handleStartEnd();
      this.graph.on('addNode', function(node) {
        return _this.addNode(node);
      });
      this.graph.on('removeNode', function(node) {
        return _this.removeNode(node);
      });
      this.graph.on('renameNode', function(oldId, newId) {
        return _this.renameNode(oldId, newId);
      });
      this.graph.on('addEdge', function(edge) {
        return _this.addEdge(edge);
      });
      this.graph.on('removeEdge', function(edge) {
        return _this.removeEdge(edge);
      });
      this.graph.on('addInitial', function(iip) {
        return _this.addInitial(iip);
      });
      this.graph.on('removeInitial', function(iip) {
        return _this.removeInitial(iip);
      });
      this.loader = new componentLoader.ComponentLoader(this.baseDir);
    }

    Network.prototype.uptime = function() {
      return new Date() - this.startupDate;
    };

    Network.prototype.handleStartEnd = function() {
      var connections, ended, started, timeOut,
        _this = this;
      connections = 0;
      started = false;
      ended = false;
      timeOut = null;
      this.on('connect', function(data) {
        if (!data.socket.from) {
          return;
        }
        if (timeOut) {
          clearTimeout(timeOut);
        }
        if (connections === 0 && !started) {
          _this.emit('start', {
            start: _this.startupDate
          });
          started = true;
        }
        return connections++;
      });
      return this.on('disconnect', function(data) {
        if (!data.socket.from) {
          return;
        }
        connections--;
        if (!(connections <= 0)) {
          return;
        }
        return timeOut = setTimeout(function() {
          if (ended) {
            return;
          }
          _this.emit('end', {
            start: _this.startupDate,
            end: new Date,
            uptime: _this.uptime()
          });
          started = false;
          return ended = true;
        }, 10);
      });
    };

    Network.prototype.load = function(component, callback) {
      if (typeof component === 'object') {
        return callback(component);
      }
      return this.loader.load(component, callback);
    };

    Network.prototype.addNode = function(node, callback) {
      var process,
        _this = this;
      if (this.processes[node.id]) {
        return;
      }
      process = {
        id: node.id
      };
      if (!node.component) {
        this.processes[process.id] = process;
        if (callback) {
          callback(process);
        }
        return;
      }
      return this.load(node.component, function(instance) {
        instance.nodeId = node.id;
        process.component = instance;
        if (instance.isSubgraph()) {
          _this.subscribeSubgraph(node.id, instance);
        }
        _this.processes[process.id] = process;
        if (callback) {
          return callback(process);
        }
      });
    };

    Network.prototype.removeNode = function(node) {
      if (!this.processes[node.id]) {
        return;
      }
      return delete this.processes[node.id];
    };

    Network.prototype.renameNode = function(oldId, newId) {
      var process;
      process = this.getNode(oldId);
      if (!process) {
        return;
      }
      process.id = newId;
      this.processes[newId] = process;
      return delete this.processes[oldId];
    };

    Network.prototype.getNode = function(id) {
      return this.processes[id];
    };

    Network.prototype.connect = function(done) {
      var edges, initializers, nodes, serialize,
        _this = this;
      if (done == null) {
        done = function() {};
      }
      serialize = function(next, add) {
        return function(type) {
          return _this["add" + type](add, function() {
            return next(type);
          });
        };
      };
      initializers = _.reduceRight(this.graph.initializers, serialize, done);
      edges = _.reduceRight(this.graph.edges, serialize, function() {
        return initializers("Initial");
      });
      nodes = _.reduceRight(this.graph.nodes, serialize, function() {
        return edges("Edge");
      });
      return nodes("Node");
    };

    Network.prototype.connectPort = function(socket, process, port, inbound) {
      if (inbound) {
        socket.to = {
          process: process,
          port: port
        };
        if (!(process.component.inPorts && process.component.inPorts[port])) {
          throw new Error("No inport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
          return;
        }
        return process.component.inPorts[port].attach(socket);
      }
      socket.from = {
        process: process,
        port: port
      };
      if (!(process.component.outPorts && process.component.outPorts[port])) {
        throw new Error("No outport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
        return;
      }
      return process.component.outPorts[port].attach(socket);
    };

    Network.prototype.subscribeSubgraph = function(nodeName, process) {
      var emitSub,
        _this = this;
      if (!process.isReady()) {
        process.once('ready', function() {
          _this.subscribeSubgraph(nodeName, process);
        });
      }
      if (!process.network) {
        return;
      }
      emitSub = function(type, data) {
        if (!data) {
          data = {};
        }
        if (data.subgraph) {
          data.subgraph = "" + nodeName + ":" + data.subgraph;
        } else {
          data.subgraph = nodeName;
        }
        return _this.emit(type, data);
      };
      process.network.on('connect', function(data) {
        return emitSub('connect', data);
      });
      process.network.on('begingroup', function(data) {
        return emitSub('begingroup', data);
      });
      process.network.on('data', function(data) {
        return emitSub('data', data);
      });
      process.network.on('endgroup', function(data) {
        return emitSub('endgroup', data);
      });
      return process.network.on('disconnect', function(data) {
        return emitSub('disconnect', data);
      });
    };

    Network.prototype.subscribeSocket = function(socket) {
      var _this = this;
      socket.on('connect', function() {
        return _this.emit('connect', {
          id: socket.getId(),
          socket: socket
        });
      });
      socket.on('begingroup', function(group) {
        return _this.emit('begingroup', {
          id: socket.getId(),
          socket: socket,
          group: group
        });
      });
      socket.on('data', function(data) {
        return _this.emit('data', {
          id: socket.getId(),
          socket: socket,
          data: data
        });
      });
      socket.on('endgroup', function(group) {
        return _this.emit('endgroup', {
          id: socket.getId(),
          socket: socket,
          group: group
        });
      });
      return socket.on('disconnect', function() {
        return _this.emit('disconnect', {
          id: socket.getId(),
          socket: socket
        });
      });
    };

    Network.prototype.addEdge = function(edge, callback) {
      var from, socket, to,
        _this = this;
      socket = internalSocket.createSocket();
      from = this.getNode(edge.from.node);
      if (!from) {
        throw new Error("No process defined for outbound node " + edge.from.node);
      }
      if (!from.component) {
        throw new Error("No component defined for outbound node " + edge.from.node);
      }
      if (!from.component.isReady()) {
        from.component.once("ready", function() {
          return _this.addEdge(edge, callback);
        });
        return;
      }
      to = this.getNode(edge.to.node);
      if (!to) {
        throw new Error("No process defined for inbound node " + edge.to.node);
      }
      if (!to.component) {
        throw new Error("No component defined for inbound node " + edge.to.node);
      }
      if (!to.component.isReady()) {
        to.component.once("ready", function() {
          return _this.addEdge(edge, callback);
        });
        return;
      }
      this.connectPort(socket, to, edge.to.port, true);
      this.connectPort(socket, from, edge.from.port, false);
      this.subscribeSocket(socket);
      this.connections.push(socket);
      if (callback) {
        return callback();
      }
    };

    Network.prototype.removeEdge = function(edge) {
      var connection, _i, _len, _ref, _results;
      _ref = this.connections;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        connection = _ref[_i];
        if (!connection) {
          continue;
        }
        if (!(edge.to.node === connection.to.process.id && edge.to.port === connection.to.port)) {
          continue;
        }
        connection.to.process.component.inPorts[connection.to.port].detach(connection);
        if (edge.from.node) {
          if (connection.from && edge.from.node === connection.from.process.id && edge.from.port === connection.from.port) {
            connection.from.process.component.outPorts[connection.from.port].detach(connection);
          }
        }
        _results.push(this.connections.splice(this.connections.indexOf(connection), 1));
      }
      return _results;
    };

    Network.prototype.addInitial = function(initializer, callback) {
      var socket, to,
        _this = this;
      socket = internalSocket.createSocket();
      this.subscribeSocket(socket);
      to = this.getNode(initializer.to.node);
      if (!to) {
        throw new Error("No process defined for inbound node " + initializer.to.node);
      }
      if (!(to.component.isReady() || to.component.inPorts[initializer.to.port])) {
        to.component.setMaxListeners(0);
        to.component.once("ready", function() {
          return _this.addInitial(initializer, callback);
        });
        return;
      }
      this.connectPort(socket, to, initializer.to.port, true);
      this.connections.push(socket);
      this.initials.push({
        socket: socket,
        data: initializer.from.data
      });
      if (callback) {
        return callback();
      }
    };

    Network.prototype.removeInitial = function(initializer) {
      var connection, _i, _len, _ref, _results;
      _ref = this.connections;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        connection = _ref[_i];
        if (!connection) {
          continue;
        }
        if (!(initializer.to.node === connection.to.process.id && initializer.to.port === connection.to.port)) {
          continue;
        }
        connection.to.process.component.inPorts[connection.to.port].detach(connection);
        _results.push(this.connections.splice(this.connections.indexOf(connection), 1));
      }
      return _results;
    };

    Network.prototype.sendInitial = function(initial) {
      initial.socket.connect();
      initial.socket.send(initial.data);
      return initial.socket.disconnect();
    };

    Network.prototype.sendInitials = function() {
      var send,
        _this = this;
      send = function() {
        var initial, _i, _len, _ref;
        _ref = _this.initials;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          initial = _ref[_i];
          _this.sendInitial(initial);
        }
        return _this.initials = [];
      };
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        return process.nextTick(send);
      } else {
        return setTimeout(send, 0);
      }
    };

    return Network;

  })(EventEmitter);

  exports.Network = Network;

}).call(this);