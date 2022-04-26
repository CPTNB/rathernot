const { builtinModules } = require('module');

const nodeStl = new Set(builtinModules);
module.exports.nodeExternals = {
  name: 'rathernot-node-externals',
  setup(build) {
  build.onResolve({ filter: /.*/ }, async (args) => {
    if (nodeStl.has(args.path)) {
      return {
        path: args.path,
        namespace: 'nodestl'
      }
    }
  });
  build.onLoad({filter: /.*/, namespace: 'nodestl' }, async (args) => {
    return {
      contents: "",
      loader: 'js'
    }
  });
  }
};
