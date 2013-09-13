(function() {
  var EventEmitter, Port,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    EventEmitter = require('events').EventEmitter;
  } else {
    EventEmitter = require('emitter');
  }

  Port = (function(_super) {
    __extends(Port, _super);

    function Port(type) {
      this.type = type;
      if (!this.type) {
        this.type = 'all';
      }
      this.socket = null;
      this.from = null;
    }

    Port.prototype.attach = function(socket) {
      if (this.isAttached()) {
        throw new Error("" + this.name + ": Socket already attached " + (this.socket.getId()) + " - " + (socket.getId()));
      }
      this.socket = socket;
      return this.attachSocket(socket);
    };

    Port.prototype.attachSocket = function(socket, localId) {
      var _this = this;
      if (localId == null) {
        localId = null;
      }
      this.emit("attach", socket);
      this.from = socket.from;
      if (socket.setMaxListeners) {
        socket.setMaxListeners(0);
      }
      socket.on("connect", function() {
        return _this.emit("connect", socket, localId);
      });
      socket.on("begingroup", function(group) {
        return _this.emit("begingroup", group, localId);
      });
      socket.on("data", function(data) {
        return _this.emit("data", data, localId);
      });
      socket.on("endgroup", function(group) {
        return _this.emit("endgroup", group, localId);
      });
      return socket.on("disconnect", function() {
        return _this.emit("disconnect", socket, localId);
      });
    };

    Port.prototype.connect = function() {
      if (!this.socket) {
        throw new Error("No connection available");
      }
      return this.socket.connect();
    };

    Port.prototype.beginGroup = function(group) {
      var _this = this;
      if (!this.socket) {
        throw new Error("No connection available");
      }
      if (this.isConnected()) {
        return this.socket.beginGroup(group);
      }
      this.socket.once("connect", function() {
        return _this.socket.beginGroup(group);
      });
      return this.socket.connect();
    };

    Port.prototype.send = function(data) {
      var _this = this;
      if (!this.socket) {
        throw new Error("No connection available");
      }
      if (this.isConnected()) {
        return this.socket.send(data);
      }
      this.socket.once("connect", function() {
        return _this.socket.send(data);
      });
      return this.socket.connect();
    };

    Port.prototype.endGroup = function() {
      if (!this.socket) {
        throw new Error("No connection available");
      }
      return this.socket.endGroup();
    };

    Port.prototype.disconnect = function() {
      if (!this.socket) {
        throw new Error("No connection available");
      }
      return this.socket.disconnect();
    };

    Port.prototype.detach = function(socket) {
      if (!this.isAttached(socket)) {
        return;
      }
      this.emit("detach", this.socket);
      this.from = null;
      return this.socket = null;
    };

    Port.prototype.isConnected = function() {
      if (!this.socket) {
        return false;
      }
      return this.socket.isConnected();
    };

    Port.prototype.isAttached = function() {
      return this.socket !== null;
    };

    return Port;

  })(EventEmitter);

  exports.Port = Port;

}).call(this);
