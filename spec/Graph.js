var chai, graph;

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  if (!chai) {
    chai = require('chai');
  }
  graph = require('../src/lib/Graph.coffee');
} else {
  graph = require('noflo/src/lib/Graph.js');
}

describe('Unnamed graph instance', function() {
  return it('should have an empty name', function() {
    var g;
    g = new graph.Graph;
    return chai.expect(g.name).to.equal('');
  });
});

describe('Graph', function() {
  describe('with new instance', function() {
    var g;
    g = null;
    it('should get a name from constructor', function() {
      g = new graph.Graph('Foo bar');
      return chai.expect(g.name).to.equal('Foo bar');
    });
    it('should have no nodes initially', function() {
      return chai.expect(g.nodes.length).to.equal(0);
    });
    it('should have no edges initially', function() {
      return chai.expect(g.edges.length).to.equal(0);
    });
    it('should have no initializers initially', function() {
      return chai.expect(g.initializers.length).to.equal(0);
    });
    it('should have no exports initially', function() {
      return chai.expect(g.exports.length).to.equal(0);
    });
    return describe('New node', function() {
      var n;
      n = null;
      it('should emit an event', function(done) {
        g.once('addNode', function(node) {
          chai.expect(node.id).to.equal('Foo');
          chai.expect(node.component).to.equal('Bar');
          n = node;
          return done();
        });
        return g.addNode('Foo', 'Bar');
      });
      it('should be in graph\'s list of nodes', function() {
        chai.expect(g.nodes.length).to.equal(1);
        return chai.expect(g.nodes.indexOf(n)).to.equal(0);
      });
      it('should be accessible via the getter', function() {
        var node;
        node = g.getNode('Foo');
        chai.expect(node.id).to.equal('Foo');
        return chai.expect(node).to.equal(n);
      });
      it('should have empty metadata', function() {
        var node;
        node = g.getNode('Foo');
        chai.expect(JSON.stringify(node.metadata)).to.equal('{}');
        return chai.expect(node.display).to.equal(void 0);
      });
      it('should be available in the JSON export', function() {
        var json;
        json = g.toJSON();
        chai.expect(typeof json.processes.Foo).to.equal('object');
        chai.expect(json.processes.Foo.component).to.equal('Bar');
        return chai.expect(json.processes.Foo.display).to.not.exist;
      });
      it('removing should emit an event', function(done) {
        g.once('removeNode', function(node) {
          chai.expect(node.id).to.equal('Foo');
          chai.expect(node).to.equal(n);
          return done();
        });
        return g.removeNode('Foo');
      });
      return it('should not be available after removal', function() {
        var node;
        node = g.getNode('Foo');
        chai.expect(node).to.not.exist;
        chai.expect(g.nodes.length).to.equal(0);
        return chai.expect(g.nodes.indexOf(n)).to.equal(-1);
      });
    });
  });
  describe('loaded from JSON', function() {
    var g, json;
    json = {
      properties: {},
      exports: [],
      processes: {
        Foo: {
          component: 'Bar',
          metadata: {
            display: {
              x: 100,
              y: 200
            },
            routes: ['one', 'two']
          }
        },
        Bar: {
          component: 'Baz'
        }
      },
      connections: [
        {
          src: {
            process: 'Foo',
            port: 'out'
          },
          tgt: {
            process: 'Bar',
            port: 'in'
          },
          metadata: {
            route: 'foo'
          }
        }, {
          data: 'Hello, world!',
          tgt: {
            process: 'Foo',
            port: 'in'
          }
        }
      ]
    };
    g = null;
    it('should produce a Graph', function(done) {
      return graph.loadJSON(json, function(instance) {
        g = instance;
        chai.expect(g).to.be.an('object');
        return done();
      });
    });
    it('should contain two nodes', function() {
      return chai.expect(g.nodes.length).to.equal(2);
    });
    it('the first Node should have its metadata intact', function() {
      var node;
      node = g.getNode('Foo');
      chai.expect(node.metadata).to.be.an('object');
      chai.expect(node.metadata.display).to.be.an('object');
      chai.expect(node.metadata.display.x).to.equal(100);
      chai.expect(node.metadata.display.y).to.equal(200);
      chai.expect(node.metadata.routes).to.be.an('array');
      chai.expect(node.metadata.routes).to.contain('one');
      return chai.expect(node.metadata.routes).to.contain('two');
    });
    it('should contain one connection', function() {
      return chai.expect(g.edges.length).to.equal(1);
    });
    it('the first Edge should have its metadata intact', function() {
      var edge;
      edge = g.edges[0];
      chai.expect(edge.metadata).to.be.an('object');
      return chai.expect(edge.metadata.route).equal('foo');
    });
    it('should contain one IIP', function() {
      return chai.expect(g.initializers.length).to.equal(1);
    });
    it('should contain no exports', function() {
      return chai.expect(g.exports.length).to.equal(0);
    });
    it('should produce same JSON when serialized', function() {
      return chai.expect(g.toJSON()).to.eql(json);
    });
    return describe('renaming a node', function() {
      it('should emit an event', function(done) {
        g.once('renameNode', function(oldId, newId) {
          chai.expect(oldId).to.equal('Foo');
          chai.expect(newId).to.equal('Baz');
          return done();
        });
        return g.renameNode('Foo', 'Baz');
      });
      it('should be available with the new name', function() {
        return chai.expect(g.getNode('Baz')).to.be.an('object');
      });
      it('shouldn\'t be available with the old name', function() {
        return chai.expect(g.getNode('Foo')).to.be["null"];
      });
      it('should have the edge still going from it', function() {
        var connection, edge, _i, _len, _ref;
        connection = null;
        _ref = g.edges;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          edge = _ref[_i];
          if (edge.from.node === 'Baz') {
            connection = edge;
          }
        }
        return chai.expect(connection).to.be.an('object');
      });
      return it('should have the IIP still going to it', function() {
        var edge, iip, _i, _len, _ref;
        iip = null;
        _ref = g.initializers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          edge = _ref[_i];
          if (edge.to.node === 'Baz') {
            iip = edge;
          }
        }
        return chai.expect(iip).to.be.an('object');
      });
    });
  });
  describe('with multiple connected ArrayPorts', function() {
    var g;
    g = new graph.Graph;
    g.addNode('Split1', 'Split');
    g.addNode('Split2', 'Split');
    g.addNode('Merge1', 'Merge');
    g.addNode('Merge2', 'Merge');
    g.addEdge('Split1', 'out', 'Merge1', 'in');
    g.addEdge('Split1', 'out', 'Merge2', 'in');
    g.addEdge('Split2', 'out', 'Merge1', 'in');
    g.addEdge('Split2', 'out', 'Merge2', 'in');
    it('should contain four nodes', function() {
      return chai.expect(g.nodes.length).to.equal(4);
    });
    it('should contain four edges', function() {
      return chai.expect(g.edges.length).to.equal(4);
    });
    it('should allow a specific edge to be removed', function() {
      g.removeEdge('Split1', 'out', 'Merge2', 'in');
      return chai.expect(g.edges.length).to.equal(3);
    });
    it('shouldn\'t contain the removed connection from Split1', function() {
      var connection, edge, _i, _len, _ref;
      connection = null;
      _ref = g.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if (edge.from.node === 'Split1' && edge.to.node === 'Merge2') {
          connection = edge;
        }
      }
      return chai.expect(connection).to.be["null"];
    });
    return it('should still contain the other connection from Split1', function() {
      var connection, edge, _i, _len, _ref;
      connection = null;
      _ref = g.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if (edge.from.node === 'Split1' && edge.to.node === 'Merge1') {
          connection = edge;
        }
      }
      return chai.expect(connection).to.be.an('object');
    });
  });
  return describe('with an Initial Information Packet', function() {
    var g;
    g = new graph.Graph;
    g.addNode('Split', 'Split');
    g.addInitial('Foo', 'Split', 'in');
    it('should contain one node', function() {
      return chai.expect(g.nodes.length).to.equal(1);
    });
    it('should contain no edges', function() {
      return chai.expect(g.edges.length).to.equal(0);
    });
    it('should contain one IIP', function() {
      return chai.expect(g.initializers.length).to.equal(1);
    });
    return describe('on removing that IIP', function() {
      it('should emit a removeInitial event', function(done) {
        g.once('removeInitial', function(iip) {
          chai.expect(iip.from.data).to.equal('Foo');
          chai.expect(iip.to.node).to.equal('Split');
          chai.expect(iip.to.port).to.equal('in');
          return done();
        });
        return g.removeInitial('Split', 'in');
      });
      return it('should contain no IIPs', function() {
        return chai.expect(g.initializers.length).to.equal(0);
      });
    });
  });
});
