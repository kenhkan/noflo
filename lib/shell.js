(function() {
  var app, noflo, noflo_root, normalizePath, shell;

  noflo_root = "" + __dirname + "/..";

  noflo = require("./NoFlo");

  shell = require("shell");

  process.on("uncaughtException", function(e) {
    app.styles.red("" + e.stack + "\n");
    e.stopPropagation();
    return app.prompt();
  });

  app = new shell({
    isShell: true
  });

  app.setPrompt = function(prompt) {
    return this.settings.prompt = "" + prompt + ">> ";
  };

  app.configure(function() {
    app.use(shell.router({
      shell: app
    }));
    return app.use(shell.help({
      shell: app,
      introduction: true
    }));
  });

  app.setPrompt("NoFlo");

  app.network = null;

  app.filename = null;

  normalizePath = function(path) {
    if (path.substr(0, 1) === "/") {
      return path;
    }
    return "" + (process.cwd()) + "/" + path;
  };

  app.cmd("new *", "Create a new NoFlo graph", function(req, res, next) {
    var graph;
    graph = noflo.graph.createGraph(req.params[0]);
    app.setPrompt(req.params[0]);
    app.network = noflo.createNetwork(graph);
    delete app.filename;
    return res.prompt();
  });

  app.cmd("load *", "Load a NoFlo graph", function(req, res, next) {
    app.filename = normalizePath(req.params[0]);
    return noflo.loadFile(app.filename, function(network) {
      app.network = network;
      app.setPrompt(app.network.graph.name);
      return res.prompt();
    });
  });

  app.cmd("save *", "Save a NoFlo graph", function(req, res, next) {
    app.filename = normalizePath(req.params[0]);
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    return noflo.saveFile(app.network.graph, app.filename, function() {
      app.styles.green("Saved to " + app.filename);
      return res.prompt();
    });
  });

  app.cmd("save", "Save a NoFlo graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    if (!app.filename) {
      app.styles.red("No filename known, use 'save <somefile>'");
      return res.prompt();
    }
    return noflo.saveFile(app.filename, app.network.graph, function() {
      app.styles.green("Saved to " + app.filename);
      return res.prompt();
    });
  });

  app.cmd("close", "Close a NoFlo graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    delete app.network;
    delete app.filename;
    app.setPrompt("NoFlo");
    return res.prompt();
  });

  app.cmd("add :id :component", "Add a node to the graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.network.graph.addNode(req.params.id, req.params.component);
    return res.prompt();
  });

  app.cmd("remove :id", "Remove a node from the graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.network.graph.removeNode(req.params.id);
    return res.prompt();
  });

  app.cmd("connect :fromid :fromport :toid :toport", "Connect nodes in graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.network.graph.addEdge(req.params.fromid, req.params.fromport, req.params.toid, req.params.toport);
    return res.prompt();
  });

  app.cmd("disconnect :id :port", "Disconnect a node in graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.network.graph.removeEdge(req.params.id, req.params.port);
    return res.prompt();
  });

  app.cmd("send :id :port :data", "Send data packet to a node", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.network.graph.addInitial(req.params.data, req.params.id, req.params.port);
    return res.prompt();
  });

  app.cmd("dot", "Get a DOT visualization of a graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.styles.blue(app.network.graph.toDOT());
    return res.prompt();
  });

  app.cmd("json", "Get a JSON visualization of a graph", function(req, res, next) {
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    app.styles.blue(JSON.stringify(app.network.graph.toJSON(), null, 4));
    return res.prompt();
  });

  /*
  app.cmd "startserver :port", "Start graph HTTP server", (req, res, next) ->
    unless app.network
      app.styles.red "No graph is loaded"
      return res.prompt()
  
    server = require "./Server"
    server.createServer req.params.port, (server) ->
      app.server = server
      server.networks.push app.network
      app.styles.blue "HTTP server is running in port #{req.params.port}"
      res.prompt()
  
  app.cmd "stopserver", "Stop graph HTTP server", (req, res, next) ->
    unless app.server
      app.styles.red "No server is running"
      return res.prompt()
  
    app.server.on "close", ->
      app.styles.blue "HTTP server stopped"
      app.server = null
      res.prompt()
    app.server.close()
  */


  app.cmd("uptime", "Show uptime of graph", function(req, res, next) {
    var convertUptime, prettyUptime;
    if (!app.network) {
      app.styles.red("No graph is loaded");
      return res.prompt();
    }
    convertUptime = function(uptime) {
      var days, hours, minutes, seconds, secs, timedef;
      seconds = uptime / 1000;
      days = Math.floor(seconds / 86400);
      hours = Math.floor((seconds - (days * 86400)) / 3600);
      minutes = Math.floor((seconds - (days * 86400) - (hours * 3600)) / 60);
      secs = Math.floor(seconds - (days * 86400) - (hours * 3600) - (minutes * 60));
      return timedef = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: secs
      };
    };
    prettyUptime = function(uptime) {
      var prettyDate, timedef;
      timedef = convertUptime(uptime);
      prettyDate = "Graph uptime is";
      if (timedef.days) {
        prettyDate = "" + prettyDate + " " + timedef.days + " days";
      }
      if (timedef.hours) {
        prettyDate = "" + prettyDate + " " + timedef.hours + " hours";
      }
      if (timedef.minutes) {
        prettyDate = "" + prettyDate + " " + timedef.minutes + " minutes";
      }
      if (prettyDate.length !== 15) {
        prettyDate = "" + prettyDate + " and";
      }
      return prettyDate = "" + prettyDate + " " + timedef.seconds + " seconds";
    };
    app.styles.blue(prettyUptime(app.network.uptime()));
    return res.prompt();
  });

  exports.app = app;

}).call(this);