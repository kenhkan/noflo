(function() {
  var Component, EventEmitter, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    EventEmitter = require('events').EventEmitter;
  } else {
    EventEmitter = require('emitter');
  }

  Component = (function(_super) {
    __extends(Component, _super);

    function Component() {
      _ref = Component.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Component.prototype.description = "";

    Component.prototype.getDescription = function() {
      return this.description;
    };

    Component.prototype.isReady = function() {
      return true;
    };

    Component.prototype.isSubgraph = function() {
      return false;
    };

    return Component;

  })(EventEmitter);

  exports.Component = Component;

}).call(this);
