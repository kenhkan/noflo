(function() {
  var ComponentLoader, internalSocket;

  internalSocket = require('./InternalSocket');

  ComponentLoader = (function() {
    function ComponentLoader(baseDir) {
      this.baseDir = baseDir;
      this.components = null;
      this.checked = [];
      this.revalidate = false;
    }

    ComponentLoader.prototype.getModulePrefix = function(name) {
      if (!name) {
        return '';
      }
      if (name === 'noflo') {
        return '';
      }
      return name.replace('noflo-', '');
    };

    ComponentLoader.prototype.getModuleComponents = function(moduleName) {
      var cPath, definition, dependency, e, name, prefix, _ref, _ref1, _results;
      if (this.checked.indexOf(moduleName) !== -1) {
        return;
      }
      this.checked.push(moduleName);
      try {
        definition = require("/" + moduleName + "/component.json");
      } catch (_error) {
        e = _error;
        return;
      }
      for (dependency in definition.dependencies) {
        this.getModuleComponents(dependency.replace('/', '-'));
      }
      if (!definition.noflo) {
        return;
      }
      prefix = this.getModulePrefix(definition.name);
      if (moduleName[0] === '/') {
        moduleName = moduleName.substr(1);
      }
      if (definition.noflo.components) {
        _ref = definition.noflo.components;
        for (name in _ref) {
          cPath = _ref[name];
          this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath);
        }
      }
      if (definition.noflo.graphs) {
        _ref1 = definition.noflo.graphs;
        _results = [];
        for (name in _ref1) {
          cPath = _ref1[name];
          _results.push(this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath));
        }
        return _results;
      }
    };

    ComponentLoader.prototype.listComponents = function(callback) {
      if (this.components !== null) {
        return callback(this.components);
      }
      this.components = {};
      this.getModuleComponents(this.baseDir);
      return callback(this.components);
    };

    ComponentLoader.prototype.load = function(name, callback) {
      var component, componentName, implementation, instance,
        _this = this;
      if (!this.components) {
        this.listComponents(function(components) {
          return _this.load(name, callback);
        });
        return;
      }
      component = this.components[name];
      if (!component) {
        for (componentName in this.components) {
          if (componentName.split('/')[1] === name) {
            component = this.components[componentName];
            break;
          }
        }
        if (!component) {
          throw new Error("Component " + name + " not available with base " + this.baseDir);
          return;
        }
      }
      if (this.isGraph(component)) {
        if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
          process.nextTick(function() {
            return _this.loadGraph(name, callback);
          });
        } else {
          setTimeout(function() {
            return _this.loadGraph(name, callback);
          }, 0);
        }
        return;
      }
      if (typeof component === 'function') {
        implementation = component;
        instance = new component;
      } else {
        implementation = require(component);
        instance = implementation.getComponent();
      }
      if (name === 'Graph') {
        instance.baseDir = this.baseDir;
      }
      return callback(instance);
    };

    ComponentLoader.prototype.isGraph = function(cPath) {
      if (typeof cPath !== 'string') {
        return false;
      }
      return cPath.indexOf('.fbp') !== -1 || cPath.indexOf('.json') !== -1;
    };

    ComponentLoader.prototype.loadGraph = function(name, callback) {
      var graph, graphImplementation, graphSocket;
      graphImplementation = require(this.components['Graph']);
      graphSocket = internalSocket.createSocket();
      graph = graphImplementation.getComponent();
      graph.baseDir = this.baseDir;
      graph.inPorts.graph.attach(graphSocket);
      graphSocket.send(this.components[name]);
      graphSocket.disconnect();
      delete graph.inPorts.graph;
      delete graph.inPorts.start;
      return callback(graph);
    };

    ComponentLoader.prototype.registerComponent = function(packageId, name, cPath, callback) {
      var fullName, prefix;
      prefix = this.getModulePrefix(packageId);
      fullName = "" + prefix + "/" + name;
      if (!packageId) {
        fullName = name;
      }
      this.components[fullName] = cPath;
      if (callback) {
        return callback();
      }
    };

    ComponentLoader.prototype.registerGraph = function(packageId, name, gPath, callback) {
      return this.registerComponent(packageId, name, gPath, callback);
    };

    ComponentLoader.prototype.clear = function() {
      this.components = null;
      this.checked = [];
      return this.revalidate = true;
    };

    return ComponentLoader;

  })();

  exports.ComponentLoader = ComponentLoader;

}).call(this);
