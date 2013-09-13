(function() {
  var ComponentLoader, fs, internalSocket, loader, log, path, reader, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  reader = require('read-installed');

  _ = require('underscore')._;

  path = require('path');

  fs = require('fs');

  loader = require('../ComponentLoader');

  internalSocket = require('../InternalSocket');

  require('coffee-script');

  log = require('npmlog');

  log.pause();

  ComponentLoader = (function(_super) {
    __extends(ComponentLoader, _super);

    function ComponentLoader() {
      _ref = ComponentLoader.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ComponentLoader.prototype.getModuleComponents = function(moduleDef, callback) {
      var checkOwn, components, depCount, done,
        _this = this;
      components = {};
      depCount = _.keys(moduleDef.dependencies).length;
      done = _.after(depCount + 1, function() {
        return callback(components);
      });
      _.each(moduleDef.dependencies, function(def) {
        if (def.name == null) {
          return done();
        }
        return _this.getModuleComponents(def, function(depComponents) {
          var cPath, name;
          if (_.isEmpty(depComponents)) {
            return done();
          }
          for (name in depComponents) {
            cPath = depComponents[name];
            if (components[name] == null) {
              components[name] = cPath;
            }
          }
          return done();
        });
      });
      if (!moduleDef.noflo) {
        return done();
      }
      checkOwn = function(def) {
        var cPath, gPath, name, prefix, _ref1, _ref2;
        prefix = _this.getModulePrefix(def.name);
        if (def.noflo.components) {
          _ref1 = def.noflo.components;
          for (name in _ref1) {
            cPath = _ref1[name];
            components["" + prefix + "/" + name] = path.resolve(def.realPath, cPath);
          }
        }
        if (moduleDef.noflo.graphs) {
          _ref2 = def.noflo.graphs;
          for (name in _ref2) {
            gPath = _ref2[name];
            components["" + prefix + "/" + name] = path.resolve(def.realPath, gPath);
          }
        }
        return done();
      };
      if (!this.revalidate) {
        return checkOwn(moduleDef);
      }
      return this.readPackageFile("" + moduleDef.realPath + "/package.json", function(err, data) {
        if (err) {
          return done();
        }
        return checkOwn(data);
      });
    };

    ComponentLoader.prototype.getCoreComponents = function(callback) {
      var corePath,
        _this = this;
      corePath = path.resolve(__dirname, '../../src/components');
      if (path.extname(__filename) === '.coffee') {
        corePath = path.resolve(__dirname, '../../components');
      }
      return fs.readdir(corePath, function(err, components) {
        var component, componentExtension, componentName, coreComponents, _i, _len, _ref1;
        coreComponents = {};
        if (err) {
          return callback(coreComponents);
        }
        for (_i = 0, _len = components.length; _i < _len; _i++) {
          component = components[_i];
          if (component.substr(0, 1) === '.') {
            continue;
          }
          _ref1 = component.split('.'), componentName = _ref1[0], componentExtension = _ref1[1];
          if (componentExtension !== 'coffee') {
            continue;
          }
          coreComponents[componentName] = "" + corePath + "/" + component;
        }
        return callback(coreComponents);
      });
    };

    ComponentLoader.prototype.listComponents = function(callback) {
      var done,
        _this = this;
      if (this.components !== null) {
        return callback(this.components);
      }
      this.components = {};
      done = _.after(2, function() {
        return callback(_this.components);
      });
      this.getCoreComponents(function(coreComponents) {
        var cPath, name;
        for (name in coreComponents) {
          cPath = coreComponents[name];
          _this.components[name] = cPath;
        }
        return done();
      });
      return reader(this.baseDir, function(err, data) {
        if (err) {
          return done();
        }
        return _this.getModuleComponents(data, function(components) {
          var cPath, name;
          for (name in components) {
            cPath = components[name];
            _this.components[name] = cPath;
          }
          return done();
        });
      });
    };

    ComponentLoader.prototype.getPackagePath = function(packageId, callback) {
      var find, found, seen;
      found = null;
      seen = [];
      find = function(packageData) {
        if (seen.indexOf(packageData.name) !== -1) {
          return;
        }
        seen.push(packageData.name);
        if (packageData.name === packageId) {
          found = path.resolve(packageData.realPath, './package.json');
          return;
        }
        return _.each(packageData.dependencies, find);
      };
      return reader(this.baseDir, function(err, data) {
        if (err) {
          return callback(err);
        }
        find(data);
        return callback(null, found);
      });
    };

    ComponentLoader.prototype.readPackage = function(packageId, callback) {
      var _this = this;
      return this.getPackagePath(packageId, function(err, packageFile) {
        if (err) {
          return callback(err);
        }
        if (!packageFile) {
          return callback(new Error('no package found'));
        }
        return _this.readPackageFile(packageFile, callback);
      });
    };

    ComponentLoader.prototype.readPackageFile = function(packageFile, callback) {
      return fs.readFile(packageFile, 'utf-8', function(err, packageData) {
        var data;
        if (err) {
          return callback(err);
        }
        data = JSON.parse(packageData);
        data.realPath = path.dirname(packageFile);
        return callback(null, data);
      });
    };

    ComponentLoader.prototype.writePackage = function(packageId, data, callback) {
      return this.getPackagePath(packageId, function(err, packageFile) {
        var packageData;
        if (err) {
          return callback(err);
        }
        if (!packageFile) {
          return callback(new Error('no package found'));
        }
        if (data.realPath) {
          delete data.realPath;
        }
        packageData = JSON.stringify(data, null, 2);
        return fs.writeFile(packageFile, packageData, callback);
      });
    };

    ComponentLoader.prototype.registerComponent = function(packageId, name, cPath, callback) {
      var _this = this;
      if (callback == null) {
        callback = function() {};
      }
      return this.readPackage(packageId, function(err, packageData) {
        if (err) {
          return callback(err);
        }
        if (!packageData.noflo) {
          packageData.noflo = {};
        }
        if (!packageData.noflo.components) {
          packageData.noflo.components = {};
        }
        packageData.noflo.components[name] = cPath;
        _this.clear();
        return _this.writePackage(packageId, packageData, callback);
      });
    };

    ComponentLoader.prototype.registerGraph = function(packageId, name, cPath, callback) {
      var _this = this;
      if (callback == null) {
        callback = function() {};
      }
      return this.readPackage(packageId, function(err, packageData) {
        if (err) {
          return callback(err);
        }
        if (!packageData.noflo) {
          packageData.noflo = {};
        }
        if (!packageData.noflo.graphs) {
          packageData.noflo.graphs = {};
        }
        packageData.noflo.graphs[name] = cPath;
        _this.clear();
        return _this.writePackage(packageId, packageData, callback);
      });
    };

    return ComponentLoader;

  })(loader.ComponentLoader);

  exports.ComponentLoader = ComponentLoader;

}).call(this);
