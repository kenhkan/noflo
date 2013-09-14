(function() {
  var ArrayPort, port,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  port = require("./Port");

  ArrayPort = (function(_super) {
    __extends(ArrayPort, _super);

    function ArrayPort(type) {
      this.type = type;
      if (!this.type) {
        this.type = 'all';
      }
      this.sockets = [];
    }

    ArrayPort.prototype.attach = function(socket) {
      this.sockets.push(socket);
      return this.attachSocket(socket, this.sockets.length - 1);
    };

    ArrayPort.prototype.connect = function(socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("No sockets available");
        }
        this.sockets.forEach(function(socket) {
          return socket.connect();
        });
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("No socket '" + socketId + "' available");
      }
      return this.sockets[socketId].connect();
    };

    ArrayPort.prototype.beginGroup = function(group, socketId) {
      var _this = this;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("No sockets available");
        }
        this.sockets.forEach(function(socket, index) {
          return _this.beginGroup(group, index);
        });
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("No socket '" + socketId + "' available");
      }
      if (this.isConnected(socketId)) {
        return this.sockets[socketId].beginGroup(group);
      }
      this.sockets[socketId].once("connect", function() {
        return _this.sockets[socketId].beginGroup(group);
      });
      return this.sockets[socketId].connect();
    };

    ArrayPort.prototype.send = function(data, socketId) {
      var _this = this;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("No sockets available");
        }
        this.sockets.forEach(function(socket, index) {
          return _this.send(data, index);
        });
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("No socket '" + socketId + "' available");
      }
      if (this.isConnected(socketId)) {
        return this.sockets[socketId].send(data);
      }
      this.sockets[socketId].once("connect", function() {
        return _this.sockets[socketId].send(data);
      });
      return this.sockets[socketId].connect();
    };

    ArrayPort.prototype.endGroup = function(socketId) {
      var _this = this;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("No sockets available");
        }
        this.sockets.forEach(function(socket, index) {
          return _this.endGroup(index);
        });
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("No socket '" + socketId + "' available");
      }
      return this.sockets[socketId].endGroup();
    };

    ArrayPort.prototype.disconnect = function(socketId) {
      var socket, _i, _len, _ref;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("No sockets available");
        }
        _ref = this.sockets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          socket = _ref[_i];
          socket.disconnect();
        }
        return;
      }
      if (!this.sockets[socketId]) {
        return;
      }
      return this.sockets[socketId].disconnect();
    };

    ArrayPort.prototype.detach = function(socket) {
      if (this.sockets.indexOf(socket) === -1) {
        return;
      }
      this.sockets.splice(this.sockets.indexOf(socket), 1);
      return this.emit("detach", socket);
    };

    ArrayPort.prototype.isConnected = function(socketId) {
      var connected,
        _this = this;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        connected = false;
        this.sockets.forEach(function(socket) {
          if (socket.isConnected()) {
            return connected = true;
          }
        });
        return connected;
      }
      if (!this.sockets[socketId]) {
        return false;
      }
      return this.sockets[socketId].isConnected();
    };

    ArrayPort.prototype.isAttached = function(socketId) {
      if (socketId === void 0) {
        return false;
      }
      if (this.sockets[socketId]) {
        return true;
      }
      return false;
    };

    return ArrayPort;

  })(port.Port);

  exports.ArrayPort = ArrayPort;

}).call(this);