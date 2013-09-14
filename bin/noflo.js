(function() {
  var addDebug, clc, cli, noflo, nofloRoot, path, showComponent, _;

  nofloRoot = "" + __dirname + "/..";

  noflo = require("../lib/NoFlo");

  cli = require("cli");

  clc = require("cli-color");

  path = require("path");

  _ = require("underscore")._;

  cli.enable("help");

  cli.enable("version");

  cli.enable("glob");

  cli.setApp("" + nofloRoot + "/package.json");

  cli.parse({
    interactive: ['i', 'Start an interactive NoFlo shell'],
    debug: ['debug', 'Start NoFlo in debug mode'],
    verbose: ['v', 'Log in verbose format'],
    subgraph: ['s', 'Log subgraph events']
  });

  showComponent = function(component, path, instance, callback) {
    if (!instance.isReady()) {
      instance.once('ready', function() {
        return showComponent(component, path, instance, callback);
      });
      return;
    }
    console.log('');
    console.log("" + component + " (" + path + ")");
    if (instance.description) {
      console.log(instance.description);
    }
    if (instance.inPorts) {
      console.log('Inports:', _.keys(instance.inPorts).join(', '));
    }
    if (instance.outPorts) {
      return console.log('Outports:', _.keys(instance.outPorts).join(', '));
    }
  };

  addDebug = function(network, verbose, logSubgraph) {
    var identifier;
    identifier = function(data) {
      var result;
      result = '';
      if (data.subgraph) {
        result += "" + (clc.magenta.italic(data.subgraph)) + " ";
      }
      result += clc.blue.italic(data.id);
      return result;
    };
    network.on('connect', function(data) {
      if (data.subgraph && !logSubgraph) {
        return;
      }
      return console.log("" + (identifier(data)) + " " + (clc.yellow('CONN')));
    });
    network.on('begingroup', function(data) {
      if (data.subgraph && !logSubgraph) {
        return;
      }
      return console.log("" + (identifier(data)) + " " + (clc.cyan('< ' + data.group)));
    });
    network.on('data', function(data) {
      if (data.subgraph && !logSubgraph) {
        return;
      }
      if (verbose) {
        console.log("" + (identifier(data)) + " " + (clc.green('DATA')), data.data);
        return;
      }
      return console.log("" + (identifier(data)) + " " + (clc.green('DATA')));
    });
    network.on('endgroup', function(data) {
      if (data.subgraph && !logSubgraph) {
        return;
      }
      return console.log("" + (identifier(data)) + " " + (clc.cyan('> ' + data.group)));
    });
    return network.on('disconnect', function(data) {
      if (data.subgraph && !logSubgraph) {
        return;
      }
      return console.log("" + (identifier(data)) + " " + (clc.yellow('DISC')));
    });
  };

  cli.main(function(args, options) {
    var arg, baseDir, loader, shell, _i, _len, _ref, _results;
    if (options.interactive) {
      process.argv = [process.argv[0], process.argv[1]];
      shell = require("" + nofloRoot + "/lib/shell");
    }
    if (!cli.args.length) {
      return;
    }
    if (cli.args.length === 2 && cli.args[0] === 'list') {
      baseDir = path.resolve(process.cwd(), cli.args[1]);
      loader = new noflo.ComponentLoader(baseDir);
      loader.listComponents(function(components) {
        var todo;
        todo = components.length;
        return _.each(components, function(path, component) {
          var instance;
          return instance = loader.load(component, function(instance) {
            return showComponent(component, path, instance, function() {
              todo--;
              if (todo === 0) {
                return process.exit(0);
              }
            });
          });
        });
      });
      return;
    }
    _ref = cli.args;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      if (arg.indexOf(".json") === -1 && arg.indexOf(".fbp") === -1) {
        console.error("" + arg + " is not a NoFlo graph file, skipping");
        continue;
      }
      arg = path.resolve(process.cwd(), arg);
      _results.push(noflo.loadFile(arg, function(network) {
        if (options.debug) {
          addDebug(network, options.verbose, options.subgraph);
        }
        if (!options.interactive) {
          return;
        }
        shell.app.network = network;
        return shell.app.setPrompt(network.graph.name);
      }));
    }
    return _results;
  });

}).call(this);