(function() {
  var EventEmitter, Graph,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    EventEmitter = require('events').EventEmitter;
  } else {
    EventEmitter = require('emitter');
  }

  Graph = (function(_super) {
    __extends(Graph, _super);

    Graph.prototype.name = '';

    Graph.prototype.nodes = [];

    Graph.prototype.edges = [];

    Graph.prototype.initializers = [];

    Graph.prototype.exports = [];

    function Graph(name) {
      this.name = name != null ? name : '';
      this.nodes = [];
      this.edges = [];
      this.initializers = [];
      this.exports = [];
    }

    Graph.prototype.addExport = function(privatePort, publicPort) {
      return this.exports.push({
        "private": privatePort.toLowerCase(),
        "public": publicPort.toLowerCase()
      });
    };

    Graph.prototype.addNode = function(id, component, metadata) {
      var node;
      if (!metadata) {
        metadata = {};
      }
      node = {
        id: id,
        component: component,
        metadata: metadata
      };
      this.nodes.push(node);
      this.emit('addNode', node);
      return node;
    };

    Graph.prototype.removeNode = function(id) {
      var edge, initializer, node, _i, _j, _len, _len1, _ref, _ref1;
      node = this.getNode(id);
      _ref = this.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if (!edge) {
          continue;
        }
        if (edge.from.node === node.id) {
          this.removeEdge(edge.from.node, edge.from.port);
        }
        if (edge.to.node === node.id) {
          this.removeEdge(edge.to.node, edge.to.port);
        }
      }
      _ref1 = this.initializers;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        initializer = _ref1[_j];
        if (!initializer) {
          continue;
        }
        if (initializer.to.node === node.id) {
          this.removeEdge(initializer.to.node, initializer.to.port);
        }
      }
      this.emit('removeNode', node);
      if (-1 !== this.nodes.indexOf(node)) {
        return this.nodes.splice(this.nodes.indexOf(node), 1);
      }
    };

    Graph.prototype.getNode = function(id) {
      var node, _i, _len, _ref;
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (!node) {
          continue;
        }
        if (node.id === id) {
          return node;
        }
      }
      return null;
    };

    Graph.prototype.renameNode = function(oldId, newId) {
      var edge, iip, node, _i, _j, _len, _len1, _ref, _ref1;
      node = this.getNode(oldId);
      if (!node) {
        return;
      }
      node.id = newId;
      _ref = this.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if (!edge) {
          continue;
        }
        if (edge.from.node === oldId) {
          edge.from.node = newId;
        }
        if (edge.to.node === oldId) {
          edge.to.node = newId;
        }
      }
      _ref1 = this.initializers;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        iip = _ref1[_j];
        if (!iip) {
          continue;
        }
        if (iip.to.node === oldId) {
          iip.to.node = newId;
        }
      }
      return this.emit('renameNode', oldId, newId);
    };

    Graph.prototype.addEdge = function(outNode, outPort, inNode, inPort, metadata) {
      var edge;
      if (!metadata) {
        metadata = {};
      }
      edge = {
        from: {
          node: outNode,
          port: outPort
        },
        to: {
          node: inNode,
          port: inPort
        },
        metadata: metadata
      };
      this.edges.push(edge);
      this.emit('addEdge', edge);
      return edge;
    };

    Graph.prototype.removeEdge = function(node, port, node2, port2) {
      var edge, index, _i, _len, _ref, _results;
      _ref = this.edges;
      _results = [];
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        edge = _ref[index];
        if (!edge) {
          continue;
        }
        if (edge.from.node === node && edge.from.port === port) {
          if (node2 && port2) {
            if (!(edge.to.node === node2 && edge.to.port === port2)) {
              continue;
            }
          }
          this.emit('removeEdge', edge);
          this.edges.splice(index, 1);
        }
        if (edge.to.node === node && edge.to.port === port) {
          if (node2 && port2) {
            if (!(edge.from.node === node2 && edge.from.port === port2)) {
              continue;
            }
          }
          this.emit('removeEdge', edge);
          _results.push(this.edges.splice(index, 1));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Graph.prototype.addInitial = function(data, node, port, metadata) {
      var initializer;
      initializer = {
        from: {
          data: data
        },
        to: {
          node: node,
          port: port
        },
        metadata: metadata
      };
      this.initializers.push(initializer);
      this.emit('addInitial', initializer);
      return initializer;
    };

    Graph.prototype.removeInitial = function(node, port) {
      var edge, index, _i, _len, _ref, _results;
      _ref = this.initializers;
      _results = [];
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        edge = _ref[index];
        if (!edge) {
          continue;
        }
        if (edge.to.node === node && edge.to.port === port) {
          this.emit('removeInitial', edge);
          _results.push(this.initializers.splice(index, 1));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Graph.prototype.toDOT = function() {
      var cleanID, cleanPort, dot, edge, id, initializer, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      cleanID = function(id) {
        return id.replace(/\s*/g, "");
      };
      cleanPort = function(port) {
        return port.replace(/\./g, "");
      };
      dot = "digraph {\n";
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        dot += "    " + (cleanID(node.id)) + " [label=" + node.id + " shape=box]\n";
      }
      _ref1 = this.initializers;
      for (id = _j = 0, _len1 = _ref1.length; _j < _len1; id = ++_j) {
        initializer = _ref1[id];
        dot += "    data" + id + " [label=\"'" + initializer.from.data + "'\" shape=plaintext]\n";
        dot += "    data" + id + " -> " + (cleanID(initializer.to.node)) + "[headlabel=" + (cleanPort(initializer.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
      }
      _ref2 = this.edges;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        edge = _ref2[_k];
        dot += "    " + (cleanID(edge.from.node)) + " -> " + (cleanID(edge.to.node)) + "[taillabel=" + (cleanPort(edge.from.port)) + " headlabel=" + (cleanPort(edge.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
      }
      dot += "}";
      return dot;
    };

    Graph.prototype.toYUML = function() {
      var edge, initializer, yuml, _i, _j, _len, _len1, _ref, _ref1;
      yuml = [];
      _ref = this.initializers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        initializer = _ref[_i];
        yuml.push("(start)[" + initializer.to.port + "]->(" + initializer.to.node + ")");
      }
      _ref1 = this.edges;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        edge = _ref1[_j];
        yuml.push("(" + edge.from.node + ")[" + edge.from.port + "]->(" + edge.to.node + ")");
      }
      return yuml.join(",");
    };

    Graph.prototype.toJSON = function() {
      var connection, edge, exported, initializer, json, node, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      json = {
        properties: {},
        exports: [],
        processes: {},
        connections: []
      };
      if (this.name) {
        json.properties.name = this.name;
      }
      _ref = this.exports;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        exported = _ref[_i];
        json.exports.push({
          "private": exported["private"],
          "public": exported["public"]
        });
      }
      _ref1 = this.nodes;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        node = _ref1[_j];
        json.processes[node.id] = {
          component: node.component
        };
        if (node.metadata) {
          json.processes[node.id].metadata = node.metadata;
        }
      }
      _ref2 = this.edges;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        edge = _ref2[_k];
        connection = {
          src: {
            process: edge.from.node,
            port: edge.from.port
          },
          tgt: {
            process: edge.to.node,
            port: edge.to.port
          }
        };
        if (Object.keys(edge.metadata).length) {
          connection.metadata = edge.metadata;
        }
        json.connections.push(connection);
      }
      _ref3 = this.initializers;
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        initializer = _ref3[_l];
        json.connections.push({
          data: initializer.from.data,
          tgt: {
            process: initializer.to.node,
            port: initializer.to.port
          }
        });
      }
      return json;
    };

    Graph.prototype.save = function(file, success) {
      var json;
      json = JSON.stringify(this.toJSON(), null, 4);
      return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return success(file);
      });
    };

    return Graph;

  })(EventEmitter);

  exports.Graph = Graph;

  exports.createGraph = function(name) {
    return new Graph(name);
  };

  exports.loadJSON = function(definition, success) {
    var conn, def, exported, graph, id, metadata, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    if (!definition.properties) {
      definition.properties = {};
    }
    if (!definition.processes) {
      definition.processes = {};
    }
    if (!definition.connections) {
      definition.connections = [];
    }
    graph = new Graph(definition.properties.name);
    _ref = definition.processes;
    for (id in _ref) {
      def = _ref[id];
      if (!def.metadata) {
        def.metadata = {};
      }
      graph.addNode(id, def.component, def.metadata);
    }
    _ref1 = definition.connections;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      conn = _ref1[_i];
      if (conn.data !== void 0) {
        graph.addInitial(conn.data, conn.tgt.process, conn.tgt.port.toLowerCase());
        continue;
      }
      metadata = conn.metadata ? conn.metadata : {};
      graph.addEdge(conn.src.process, conn.src.port.toLowerCase(), conn.tgt.process, conn.tgt.port.toLowerCase(), metadata);
    }
    if (definition.exports) {
      _ref2 = definition.exports;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        exported = _ref2[_j];
        graph.addExport(exported["private"], exported["public"]);
      }
    }
    return success(graph);
  };

  exports.loadFBP = function(fbpData, success) {
    var definition;
    definition = require('fbp').parse(fbpData);
    return exports.loadJSON(definition, success);
  };

  exports.loadFile = function(file, success) {
    var definition, e;
    if (!(typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1)) {
      try {
        definition = require(file);
        exports.loadJSON(definition, success);
      } catch (_error) {
        e = _error;
        throw new Error("Failed to load graph " + file + ": " + e.message);
      }
      return;
    }
    return require('fs').readFile(file, "utf-8", function(err, data) {
      if (err) {
        throw err;
      }
      if (file.split('.').pop() === 'fbp') {
        return exports.loadFBP(data, success);
      }
      definition = JSON.parse(data);
      return exports.loadJSON(definition, success);
    });
  };

}).call(this);