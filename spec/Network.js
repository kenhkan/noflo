var chai, noflo, path, root,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  if (!chai) {
    chai = require('chai');
  }
  noflo = require('../src/lib/NoFlo.coffee');
  path = require('path');
  root = path.resolve(__dirname, '../');
} else {
  noflo = require('noflo/src/lib/NoFlo.js');
  root = 'noflo';
}

describe('NoFlo Network', function() {
  var Callback, Merge, Split;
  Split = (function(_super) {
    __extends(Split, _super);

    function Split() {
      var _this = this;
      this.inPorts = {
        "in": new noflo.Port
      };
      this.outPorts = {
        out: new noflo.ArrayPort
      };
      this.inPorts["in"].on('data', function(data) {
        return _this.outPorts.out.send(data);
      });
      this.inPorts["in"].on('disconnect', function() {
        return _this.outPorts.out.disconnect();
      });
    }

    return Split;

  })(noflo.Component);
  Merge = (function(_super) {
    __extends(Merge, _super);

    function Merge() {
      var _this = this;
      this.inPorts = {
        "in": new noflo.ArrayPort
      };
      this.outPorts = {
        out: new noflo.Port
      };
      this.inPorts["in"].on('data', function(data) {
        return _this.outPorts.out.send(data);
      });
      this.inPorts["in"].on('disconnect', function() {
        return _this.outPorts.out.disconnect();
      });
    }

    return Merge;

  })(noflo.Component);
  Callback = (function(_super) {
    __extends(Callback, _super);

    function Callback() {
      var _this = this;
      this.cb = null;
      this.inPorts = {
        "in": new noflo.Port,
        callback: new noflo.Port
      };
      this.outPorts = {};
      this.inPorts.callback.on('data', function(data) {
        return _this.cb = data;
      });
      this.inPorts["in"].on('data', function(data) {
        return _this.cb(data);
      });
    }

    return Callback;

  })(noflo.Component);
  describe('with an empty graph', function() {
    var g, n;
    g = new noflo.Graph;
    g.baseDir = root;
    n = new noflo.Network(g);
    it('should initially have no processes', function() {
      return chai.expect(n.processes).to.be.empty;
    });
    it('should initially have to connections', function() {
      return chai.expect(n.connections).to.be.empty;
    });
    it('should initially have no IIPs', function() {
      return chai.expect(n.initials).to.be.empty;
    });
    it('should have reference to the graph', function() {
      return chai.expect(n.graph).to.equal(g);
    });
    it('should know its baseDir', function() {
      return chai.expect(n.baseDir).to.equal(g.baseDir);
    });
    it('should have a ComponentLoader', function() {
      return chai.expect(n.loader).to.be.an('object');
    });
    it('should have transmitted the baseDir to the Component Loader', function() {
      return chai.expect(n.loader.baseDir).to.equal(g.baseDir);
    });
    it('should have an uptime', function() {
      return chai.expect(n.uptime()).to.be.above(0);
    });
    return describe('with new node', function() {
      it('should contain the node', function(done) {
        g.once('addNode', function() {
          return setTimeout(function() {
            chai.expect(n.processes).not.to.be.empty;
            chai.expect(n.processes.Graph).to.exist;
            return done();
          }, 10);
        });
        return g.addNode('Graph', 'Graph');
      });
      return it('should not contain the node after removal', function(done) {
        g.once('removeNode', function() {
          return setTimeout(function() {
            chai.expect(n.processes).to.be.empty;
            return done();
          }, 10);
        });
        return g.removeNode('Graph');
      });
    });
  });
  describe('with a simple graph', function() {
    var g, n;
    g = null;
    n = null;
    before(function(done) {
      g = new noflo.Graph;
      g.baseDir = root;
      g.addNode('Merge', 'Merge');
      g.addNode('Callback', 'Callback');
      g.addEdge('Merge', 'out', 'Callback', 'in');
      return noflo.createNetwork(g, function(nw) {
        nw.loader.components.Split = Split;
        nw.loader.components.Merge = Merge;
        nw.loader.components.Callback = Callback;
        n = nw;
        return nw.connect(function() {
          nw.sendInitials();
          return done();
        });
      }, true);
    });
    it('should contain two processes', function() {
      chai.expect(n.processes).to.not.be.empty;
      chai.expect(n.processes.Merge).to.exist;
      chai.expect(n.processes.Merge).to.be.an('Object');
      chai.expect(n.processes.Callback).to.exist;
      return chai.expect(n.processes.Callback).to.be.an('Object');
    });
    it('should contain one connection', function() {
      chai.expect(n.connections).to.not.be.empty;
      return chai.expect(n.connections.length).to.equal(1);
    });
    it('should call callback when receiving data', function(done) {
      g.addInitial(function(data) {
        chai.expect(data).to.equal('Foo');
        return done();
      }, 'Callback', 'callback');
      g.addInitial('Foo', 'Merge', 'in');
      chai.expect(n.initials).not.to.be.empty;
      return n.sendInitials();
    });
    return describe('with a renamed node', function() {
      it('should have the process in a new location', function(done) {
        g.once('renameNode', function() {
          chai.expect(n.processes.Func).to.be.an('object');
          return done();
        });
        return g.renameNode('Callback', 'Func');
      });
      return it('shouldn\'t have the process in the old location', function() {
        return chai.expect(n.processes.Callback).to.be.undefined;
      });
    });
  });
  describe("Nodes are added first, then edges, then initializers (i.e. IIPs), and in order of definition order within each", function() {
    var actual, expected, g, n, restore, stub, stubbed;
    g = null;
    n = null;
    stubbed = {};
    actual = [];
    expected = [];
    stub = function() {
      stubbed.addNode = noflo.Network.prototype.addNode;
      stubbed.addEdge = noflo.Network.prototype.addEdge;
      stubbed.addInitial = noflo.Network.prototype.addInitial;
      noflo.Network.prototype.addNode = function(node, cb) {
        actual.push(node);
        return stubbed.addNode.call(this, node, cb);
      };
      noflo.Network.prototype.addEdge = function(edge, cb) {
        actual.push(edge);
        return stubbed.addEdge.call(this, edge, cb);
      };
      return noflo.Network.prototype.addInitial = function(initial, cb) {
        actual.push(initial);
        return stubbed.addInitial.call(this, initial, cb);
      };
    };
    restore = function() {
      noflo.Network.prototype.addNode = stubbed.addNode;
      noflo.Network.prototype.addEdge = stubbed.addEdge;
      return noflo.Network.prototype.addInitial = stubbed.addInitial;
    };
    before(function(done) {
      stub();
      g = new noflo.Graph;
      g.baseDir = root;
      expected[0] = g.addNode("D", "Callback");
      expected[10] = g.addInitial((function() {}), "D", "callback");
      expected[1] = g.addNode("A", "Split");
      expected[11] = g.addInitial("Hello", "A", "in");
      expected[2] = g.addNode("B1", "Merge");
      expected[5] = g.addEdge("A", "out", "B1", "in");
      expected[6] = g.addEdge("A", "out", "B2", "in");
      expected[3] = g.addNode("B2", "Merge");
      expected[4] = g.addNode("C", "Merge");
      expected[7] = g.addEdge("B1", "out", "C", "in");
      expected[12] = g.addInitial("World", "C", "in");
      expected[8] = g.addEdge("B2", "out", "C", "in");
      expected[9] = g.addEdge("C", "out", "D", "in");
      return noflo.createNetwork(g, function(nw) {
        nw.loader.components.Split = Split;
        nw.loader.components.Merge = Merge;
        nw.loader.components.Callback = Callback;
        n = nw;
        return nw.connect(function() {
          nw.sendInitials();
          return done();
        });
      }, true);
    });
    after(restore);
    return it("should add nodes, edges, and initials, in that order", function() {
      return chai.expect(actual).to.deep.equal(expected);
    });
  });
  return describe('with an existing IIP', function() {
    var g, n;
    g = null;
    n = null;
    before(function() {
      g = new noflo.Graph;
      g.baseDir = root;
      g.addNode('Callback', 'Callback');
      g.addNode('Repeat', 'Split');
      return g.addEdge('Repeat', 'out', 'Callback', 'in');
    });
    it('should call the Callback with the original IIP value', function(done) {
      var cb;
      cb = function(packet) {
        chai.expect(packet).to.equal('Foo');
        return done();
      };
      g.addInitial(cb, 'Callback', 'callback');
      g.addInitial('Foo', 'Repeat', 'in');
      return setTimeout(function() {
        return noflo.createNetwork(g, function(nw) {
          nw.loader.components.Split = Split;
          nw.loader.components.Merge = Merge;
          nw.loader.components.Callback = Callback;
          n = nw;
          return nw.connect(function() {
            return nw.sendInitials();
          });
        }, true);
      }, 10);
    });
    it('should allow removing the IIPs', function(done) {
      var onRemove, removed;
      removed = 0;
      onRemove = function() {
        removed++;
        if (removed < 2) {
          return;
        }
        chai.expect(n.initials.length).to.equal(0, 'No IIPs left');
        chai.expect(n.connections.length).to.equal(1, 'Only one connection');
        g.removeListener('removeInitial', onRemove);
        return done();
      };
      g.on('removeInitial', onRemove);
      g.removeInitial('Callback', 'callback');
      return g.removeInitial('Repeat', 'in');
    });
    return it('new IIPs to replace original ones should work correctly', function(done) {
      var cb;
      cb = function(packet) {
        chai.expect(packet).to.equal('Baz');
        return done();
      };
      g.addInitial(cb, 'Callback', 'callback');
      g.addInitial('Baz', 'Repeat', 'in');
      return n.sendInitials();
    });
  });
});
