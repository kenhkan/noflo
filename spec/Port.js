var chai, port, socket;

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  if (!chai) {
    chai = require('chai');
  }
  port = require('../src/lib/Port.coffee');
  socket = require('../src/lib/InternalSocket.coffee');
} else {
  port = require('noflo/src/lib/Port.js');
  socket = require('noflo/src/lib/InternalSocket.js');
}

describe('Untyped port instance', function() {
  return it('should be of type "all"', function() {
    var p;
    p = new port.Port;
    return chai.expect(p.type).to.equal('all');
  });
});

describe('Port instance', function() {
  var p;
  p = null;
  it('should retain the given type', function() {
    p = new port.Port('string');
    return chai.expect(p.type).to.equal('string');
  });
  describe('without attached socket', function() {
    it('should not be attached initially', function() {
      return chai.expect(p.isAttached()).to.equal(false);
    });
    it('should not be connected initially', function() {
      return chai.expect(p.isConnected()).to.equal(false);
    });
    it('should not contain a socket initially', function() {
      return chai.expect(p.socket).to.not.exist;
    });
    it('should not allow connecting', function() {
      return chai.expect(function() {
        return p.connect();
      }).to["throw"](Error);
    });
    it('should not allow beginning groups', function() {
      return chai.expect(function() {
        return p.beginGroup('Foo');
      }).to["throw"](Error);
    });
    it('should not allow sending data', function() {
      return chai.expect(function() {
        return p.send('Foo');
      }).to["throw"](Error);
    });
    it('should not allow ending groups', function() {
      return chai.expect(function() {
        return p.endGroup();
      }).to["throw"](Error);
    });
    return it('should not allow disconnecting', function() {
      return chai.expect(function() {
        return p.disconnect();
      }).to["throw"](Error);
    });
  });
  return describe('with attached socket', function() {
    var s;
    s = new socket.InternalSocket;
    it('should emit an event', function(done) {
      p.once('attach', function(sock) {
        chai.expect(sock).to.equal(s);
        return done();
      });
      return p.attach(s);
    });
    it('should be marked as attached', function() {
      return chai.expect(p.isAttached()).to.equal(true);
    });
    it('should not be connected initially', function() {
      return chai.expect(p.isConnected()).to.equal(false);
    });
    it('should have a reference to the socket', function() {
      return chai.expect(p.socket).to.equal(s);
    });
    it('should not allow other sockets to be attached', function() {
      return chai.expect(function() {
        return p.attach(new socket.InternalSocket);
      }).to["throw"](Error);
    });
    it('should emit an event on detaching', function(done) {
      p.once('detach', function(sock) {
        chai.expect(sock).to.equal(s);
        return done();
      });
      return p.detach();
    });
    it('should not be attached any longer', function() {
      return chai.expect(p.isAttached()).to.equal(false);
    });
    return it('should not contain a socket any longer', function() {
      return chai.expect(p.socket).to.not.exist;
    });
  });
});

describe('Input port', function() {
  var p, s;
  p = new port.Port;
  s = new socket.InternalSocket;
  p.attach(s);
  it('should emit connection events', function(done) {
    p.once('connect', function(sock, id) {
      chai.expect(sock).to.equal(s);
      chai.expect(id).to.equal(null);
      return done();
    });
    return s.connect();
  });
  it('should be connected after that', function() {
    return chai.expect(p.isConnected()).to.equal(true);
  });
  it('should emit begin group events', function(done) {
    p.once('begingroup', function(group, id) {
      chai.expect(group).to.equal('Foo');
      chai.expect(id).to.equal(null);
      return done();
    });
    return s.beginGroup('Foo');
  });
  it('should emit data events', function(done) {
    p.once('data', function(data, id) {
      chai.expect(data).to.equal('Bar');
      chai.expect(id).to.equal(null);
      return done();
    });
    return s.send('Bar');
  });
  it('should emit end group events', function(done) {
    p.once('endgroup', function(group, id) {
      chai.expect(group).to.equal('Foo');
      chai.expect(id).to.equal(null);
      return done();
    });
    return s.endGroup();
  });
  it('should emit disconnection events', function(done) {
    p.once('disconnect', function(sock, id) {
      chai.expect(sock).to.equal(s);
      chai.expect(id).to.equal(null);
      return done();
    });
    return s.disconnect();
  });
  it('should not be connected after that', function() {
    return chai.expect(p.isConnected()).to.equal(false);
  });
  return it('should connect automatically when sending', function(done) {
    p.once('connect', function(sock, id) {
      chai.expect(sock).to.equal(s);
      chai.expect(id).to.equal(null);
      chai.expect(p.isConnected()).to.equal(true);
      return p.once('data', function(data, id) {
        chai.expect(data).to.equal('Baz');
        chai.expect(id).to.equal(null);
        return done();
      });
    });
    return s.send('Baz');
  });
});

describe('Output port', function() {
  var p, s;
  p = new port.Port;
  s = new socket.InternalSocket;
  p.attach(s);
  it('should connect the socket', function(done) {
    s.once('connect', function() {
      chai.expect(p.isConnected()).to.equal(true);
      return done();
    });
    return p.connect();
  });
  it('should begin groups on the socket', function(done) {
    s.once('begingroup', function(group) {
      chai.expect(group).to.equal('Baz');
      return done();
    });
    return p.beginGroup('Baz');
  });
  it('should send data to the socket', function(done) {
    s.once('data', function(data) {
      chai.expect(data).to.equal('Foo');
      return done();
    });
    return p.send('Foo');
  });
  it('should end groups on the socket', function(done) {
    s.once('endgroup', function(group) {
      chai.expect(group).to.equal('Baz');
      return done();
    });
    return p.endGroup();
  });
  it('should disconnect the socket', function(done) {
    s.once('disconnect', function() {
      chai.expect(p.isConnected()).to.equal(false);
      return done();
    });
    return p.disconnect();
  });
  return it('should connect automatically when sending', function(done) {
    s.once('connect', function() {
      chai.expect(p.isConnected()).to.equal(true);
      return s.once('data', function(data) {
        chai.expect(data).to.equal('Bar');
        return done();
      });
    });
    return p.send('Bar');
  });
});
