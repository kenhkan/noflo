(function() {
  var EventEmitter, InternalSocket,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    EventEmitter = require('events').EventEmitter;
  } else {
    EventEmitter = require('emitter');
  }

  InternalSocket = (function(_super) {
    __extends(InternalSocket, _super);

    function InternalSocket() {
      this.connected = false;
      this.groups = [];
    }

    InternalSocket.prototype.connect = function() {
      if (this.connected) {
        return;
      }
      this.connected = true;
      return this.emit('connect', this);
    };

    InternalSocket.prototype.disconnect = function() {
      if (!this.connected) {
        return;
      }
      this.connected = false;
      return this.emit('disconnect', this);
    };

    InternalSocket.prototype.isConnected = function() {
      return this.connected;
    };

    InternalSocket.prototype.send = function(data) {
      if (!this.connected) {
        this.connect();
      }
      return this.emit('data', data);
    };

    InternalSocket.prototype.beginGroup = function(group) {
      this.groups.push(group);
      return this.emit('begingroup', group);
    };

    InternalSocket.prototype.endGroup = function() {
      return this.emit('endgroup', this.groups.pop());
    };

    InternalSocket.prototype.getId = function() {
      var fromStr, toStr;
      fromStr = function(from) {
        return "" + from.process.id + "() " + (from.port.toUpperCase());
      };
      toStr = function(to) {
        return "" + (to.port.toUpperCase()) + " " + to.process.id + "()";
      };
      if (!(this.from || this.to)) {
        return "UNDEFINED";
      }
      if (this.from && !this.to) {
        return "" + (fromStr(this.from)) + " -> ANON";
      }
      if (!this.from) {
        return "DATA -> " + (toStr(this.to));
      }
      return "" + (fromStr(this.from)) + " -> " + (toStr(this.to));
    };

    return InternalSocket;

  })(EventEmitter);

  exports.InternalSocket = InternalSocket;

  exports.createSocket = function() {
    return new InternalSocket;
  };

}).call(this);