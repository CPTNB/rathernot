const { builtinModules } = require('module');
const { readFile } = require('fs/promises');
const { resolve } = require('path');

const nodeStl = new Set(builtinModules);
module.exports.rathernotExternals = async (isClient) => {
  const serverRnFile = await readFile(resolve(__dirname, '../rnos/rn.js'));
  return {
    name: 'rathernot-node-externals',
    setup(build) {
    build.onResolve({ filter: /rathernot/gm }, async (args) => {
      return {
        path: args.path,
        namespace: 'rathernot'
      }
    });
    build.onLoad({filter: /.*/, namespace: 'rathernot' }, async (args) => {
      return {
        contents: isClient ? "" : serverRnFile.toString('utf-8'),
        loader: 'js'
      }
    });
    }
  }
};
