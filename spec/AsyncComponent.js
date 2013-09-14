var acomponent, chai, port, socket,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  if (!chai) {
    chai = require('chai');
  }
  acomponent = require('../src/lib/AsyncComponent.coffee');
  port = require('../src/lib/Port.coffee');
  socket = require('../src/lib/InternalSocket.coffee');
} else {
  acomponent = require('noflo/src/lib/AsyncComponent.js');
  port = require('noflo/src/lib/Port.js');
  socket = require('noflo/src/lib/InternalSocket.js');
}

describe('AsyncComponent with missing ports', function() {
  var C1, C2, _ref;
  C1 = (function(_super) {
    __extends(C1, _super);

    function C1() {
      _ref = C1.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return C1;

  })(acomponent.AsyncComponent);
  C2 = (function(_super) {
    __extends(C2, _super);

    function C2() {
      this.inPorts = {
        "in": new port.Port
      };
      C2.__super__.constructor.call(this);
    }

    return C2;

  })(acomponent.AsyncComponent);
  it('should throw an error on instantiation when no IN defined', function() {
    return chai.expect(function() {
      return new C1;
    }).to["throw"](Error);
  });
  return it('should throw an error on instantion when no OUT defined', function() {
    return chai.expect(function() {
      return new C2;
    }).to["throw"](Error);
  });
});

describe('AsyncComponent without a doAsync method', function() {
  var Unimplemented, ins, u;
  Unimplemented = (function(_super) {
    __extends(Unimplemented, _super);

    function Unimplemented() {
      this.inPorts = {
        "in": new port.Port
      };
      this.outPorts = {
        out: new port.Port,
        error: new port.Port
      };
      Unimplemented.__super__.constructor.call(this);
    }

    return Unimplemented;

  })(acomponent.AsyncComponent);
  u = new Unimplemented;
  ins = socket.createSocket();
  u.inPorts["in"].attach(ins);
  it('should throw an error if there is no connection to the ERROR port', function() {
    return chai.expect(function() {
      return ins.send('Foo');
    }).to["throw"](Error);
  });
  return it('should send an error to the ERROR port if connected', function(done) {
    var err;
    err = socket.createSocket();
    u.outPorts.error.attach(err);
    err.once('data', function(data) {
      chai.expect(data).to.be.an["instanceof"](Error);
      return done();
    });
    return ins.send('Bar');
  });
});

describe('Implemented AsyncComponent', function() {
  var Timer, err, ins, lod, out, t;
  Timer = (function(_super) {
    __extends(Timer, _super);

    function Timer() {
      this.inPorts = {
        "in": new port.Port
      };
      this.outPorts = {
        out: new port.Port,
        error: new port.Port
      };
      Timer.__super__.constructor.call(this);
    }

    Timer.prototype.doAsync = function(data, callback) {
      var _this = this;
      return setTimeout((function() {
        _this.outPorts.out.send("waited " + data);
        return callback();
      }), data);
    };

    return Timer;

  })(acomponent.AsyncComponent);
  t = null;
  ins = null;
  out = null;
  lod = null;
  err = null;
  beforeEach(function() {
    t = new Timer;
    ins = socket.createSocket();
    out = socket.createSocket();
    lod = socket.createSocket();
    err = socket.createSocket();
    t.inPorts["in"].attach(ins);
    t.outPorts.out.attach(out);
    t.outPorts.load.attach(lod);
    return t.outPorts.error.attach(err);
  });
  return it('should send load information and packets in correct order', function(done) {
    var expected, inspect, received;
    received = [];
    expected = ['load 1', 'load 2', 'load 3', 'out waited 100', 'load 2', 'out waited 200', 'load 1', 'out waited 300', 'load 0'];
    inspect = function() {
      var key, value, _i, _len;
      chai.expect(received.length).to.equal(expected.length);
      for (key = _i = 0, _len = expected.length; _i < _len; key = ++_i) {
        value = expected[key];
        chai.expect(received[key]).to.equal(value);
      }
      return done();
    };
    out.on('data', function(data) {
      return received.push("out " + data);
    });
    lod.on('data', function(data) {
      received.push("load " + data);
      if (data === 0) {
        return inspect();
      }
    });
    ins.send(300);
    ins.send(200);
    ins.send(100);
    return ins.disconnect();
  });
});