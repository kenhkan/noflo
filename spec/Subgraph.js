var chai, graph, noflo, path, root, subgraph,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  if (!chai) {
    chai = require('chai');
  }
  subgraph = require('../src/components/Graph.coffee');
  graph = require('../src/lib/Graph.coffee');
  noflo = require('../src/lib/NoFlo.coffee');
  path = require('path');
  root = path.resolve(__dirname, '../');
} else {
  subgraph = require('noflo/src/components/Graph.js');
  graph = require('noflo/src/lib/Graph.js');
  noflo = require('noflo/src/lib/NoFlo.js');
  root = 'noflo';
}

describe('Graph component', function() {
  var Merge, Split, c, g, start;
  c = null;
  g = null;
  start = null;
  beforeEach(function() {
    c = subgraph.getComponent();
    g = noflo.internalSocket.createSocket();
    start = noflo.internalSocket.createSocket();
    c.inPorts.graph.attach(g);
    return c.inPorts.start.attach(start);
  });
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
  describe('initially', function() {
    it('should be ready', function() {
      return chai.expect(c.ready).to.be["true"];
    });
    it('should not contain a network', function() {
      return chai.expect(c.network).to.be["null"];
    });
    it('should not have a baseDir', function() {
      return chai.expect(c.baseDir).to.be["null"];
    });
    return it('should only have the graph and start inports', function() {
      chai.expect(c.inPorts).to.have.keys(['graph', 'start']);
      return chai.expect(c.outPorts).to.be.empty;
    });
  });
  describe('with JSON graph definition', function() {
    it('should emit a ready event after network has been loaded', function(done) {
      c.baseDir = root;
      c.once('ready', function() {
        chai.expect(c.network).not.to.be["null"];
        chai.expect(c.ready).to.be["true"];
        return done();
      });
      c.once('network', function(network) {
        network.loader.components.Split = Split;
        network.loader.components.Merge = Merge;
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        return start.send(true);
      });
      return g.send({
        processes: {
          Split: {
            component: 'Split'
          },
          Merge: {
            component: 'Merge'
          }
        }
      });
    });
    it('should expose available ports', function(done) {
      c.baseDir = root;
      c.once('ready', function() {
        chai.expect(c.inPorts).to.have.keys(['graph', 'start', 'merge.in']);
        chai.expect(c.outPorts).to.have.keys(['split.out']);
        return done();
      });
      c.once('network', function() {
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        c.network.loader.components.Split = Split;
        c.network.loader.components.Merge = Merge;
        return start.send(true);
      });
      return g.send({
        processes: {
          Split: {
            component: 'Split'
          },
          Merge: {
            component: 'Merge'
          }
        },
        connections: [
          {
            src: {
              process: 'Merge',
              port: 'out'
            },
            tgt: {
              process: 'Split',
              port: 'in'
            }
          }
        ]
      });
    });
    it('should expose only exported ports when they exist', function(done) {
      c.baseDir = root;
      c.once('ready', function() {
        chai.expect(c.inPorts).to.have.keys(['graph', 'start']);
        chai.expect(c.outPorts).to.have.keys(['out']);
        return done();
      });
      c.once('network', function() {
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        c.network.loader.components.Split = Split;
        c.network.loader.components.Merge = Merge;
        return start.send(true);
      });
      return g.send({
        exports: [
          {
            "public": 'out',
            "private": 'split.out'
          }
        ],
        processes: {
          Split: {
            component: 'Split'
          },
          Merge: {
            component: 'Merge'
          }
        },
        connections: [
          {
            src: {
              process: 'Merge',
              port: 'out'
            },
            tgt: {
              process: 'Split',
              port: 'in'
            }
          }
        ]
      });
    });
    return it('should be able to run the graph', function(done) {
      c.baseDir = root;
      c.once('ready', function() {
        var ins, out;
        ins = noflo.internalSocket.createSocket();
        out = noflo.internalSocket.createSocket();
        c.inPorts['merge.in'].attach(ins);
        c.outPorts['split.out'].attach(out);
        out.on('data', function(data) {
          chai.expect(data).to.equal('Foo');
          return done();
        });
        return ins.send('Foo');
      });
      c.once('network', function() {
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        c.network.loader.components.Split = Split;
        c.network.loader.components.Merge = Merge;
        return start.send(true);
      });
      return g.send({
        processes: {
          Split: {
            component: 'Split'
          },
          Merge: {
            component: 'Merge'
          }
        },
        connections: [
          {
            src: {
              process: 'Merge',
              port: 'out'
            },
            tgt: {
              process: 'Split',
              port: 'in'
            }
          }
        ]
      });
    });
  });
  return describe('with a Graph instance', function() {
    var gr;
    gr = new graph.Graph('Hello, world');
    gr.baseDir = root;
    gr.addNode('Split', 'Split');
    gr.addNode('Merge', 'Merge');
    gr.addEdge('Merge', 'out', 'Split', 'in');
    it('should emit a ready event after network has been loaded', function(done) {
      c.once('ready', function() {
        chai.expect(c.network).not.to.be["null"];
        chai.expect(c.ready).to.be["true"];
        return done();
      });
      c.once('network', function() {
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        c.network.loader.components.Split = Split;
        c.network.loader.components.Merge = Merge;
        return start.send(true);
      });
      g.send(gr);
      return chai.expect(c.ready).to.be["false"];
    });
    it('should expose available ports', function(done) {
      c.baseDir = root;
      c.once('ready', function() {
        chai.expect(c.inPorts).to.have.keys(['graph', 'start', 'merge.in']);
        chai.expect(c.outPorts).to.have.keys(['split.out']);
        return done();
      });
      c.once('network', function() {
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        c.network.loader.components.Split = Split;
        c.network.loader.components.Merge = Merge;
        return start.send(true);
      });
      return g.send(gr);
    });
    return it('should be able to run the graph', function(done) {
      c.baseDir = root;
      c.once('ready', function() {
        var ins, out;
        ins = noflo.internalSocket.createSocket();
        out = noflo.internalSocket.createSocket();
        c.inPorts['merge.in'].attach(ins);
        c.outPorts['split.out'].attach(out);
        out.on('data', function(data) {
          chai.expect(data).to.equal('Foo');
          return done();
        });
        return ins.send('Foo');
      });
      c.once('network', function() {
        chai.expect(c.ready).to.be["false"];
        chai.expect(c.network).not.to.be["null"];
        c.network.loader.components.Split = Split;
        c.network.loader.components.Merge = Merge;
        return start.send(true);
      });
      return g.send(gr);
    });
  });
});
