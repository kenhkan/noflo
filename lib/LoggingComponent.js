(function() {
  var Component, Port, util,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Component = require("./Component").Component;

  Port = require("./Port").Port;

  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    util = require("util");
  } else {
    util = {
      inspect: function(data) {
        return data;
      }
    };
  }

  exports.LoggingComponent = (function(_super) {
    __extends(LoggingComponent, _super);

    function LoggingComponent() {
      this.sendLog = __bind(this.sendLog, this);
      this.outPorts = {
        log: new Port()
      };
    }

    LoggingComponent.prototype.sendLog = function(message) {
      if (typeof message === "object") {
        message.when = new Date;
        message.source = this.constructor.name;
        if (this.nodeId != null) {
          message.nodeID = this.nodeId;
        }
      }
      if ((this.outPorts.log != null) && this.outPorts.log.isAttached()) {
        return this.outPorts.log.send(message);
      } else {
        return console.log(util.inspect(message, 4, true, true));
      }
    };

    return LoggingComponent;

  })(Component);

}).call(this);