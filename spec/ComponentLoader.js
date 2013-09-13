var chai, loader, path, root;

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  if (!chai) {
    chai = require('chai');
  }
  loader = require('../src/lib/nodejs/ComponentLoader.coffee');
  path = require('path');
  root = path.resolve(__dirname, '../');
} else {
  loader = require('noflo/src/lib/ComponentLoader.js');
  root = 'noflo';
}

describe('ComponentLoader with no external packages installed', function() {
  var l;
  l = new loader.ComponentLoader(root);
  it('should initially know of no components', function() {
    return chai.expect(l.components).to.be["null"];
  });
  it('should not initially require revalidation', function() {
    return chai.expect(l.revalidate).to.be["false"];
  });
  it('should not have any packages in the checked list', function() {
    return chai.expect(l.checked).to.be.empty;
  });
  it('should be able to read a list of components', function(done) {
    return l.listComponents(function(components) {
      chai.expect(l.components).not.to.be.empty;
      chai.expect(components).to.equal(l.components);
      return done();
    });
  });
  it('should have the Graph component registered', function() {
    return chai.expect(l.components.Graph).not.to.be.empty;
  });
  describe('loading the Graph component', function() {
    var instance;
    instance = null;
    it('should be able to load the component', function(done) {
      return l.load('Graph', function(split) {
        chai.expect(split).to.be.an('object');
        instance = split;
        return done();
      });
    });
    it('should contain input ports', function() {
      chai.expect(instance.inPorts).to.be.an('object');
      return chai.expect(instance.inPorts.graph).to.be.an('object');
    });
    return it('should have "on" method on the input port', function() {
      return chai.expect(instance.inPorts.graph.on).to.be.a('function');
    });
  });
  return describe('loading the Graph component', function() {
    var instance;
    instance = null;
    it('should be able to load the component', function(done) {
      return l.load('Graph', function(graph) {
        chai.expect(graph).to.be.an('object');
        instance = graph;
        return done();
      });
    });
    return it('should have a reference to the Component Loader\'s baseDir', function() {
      return chai.expect(instance.baseDir).to.equal(l.baseDir);
    });
  });
});
