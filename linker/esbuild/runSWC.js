const { parse, resolve } = require('path');
const { access, F_OK, writeFile } = require('fs/promises');
const { spawnP } = require('../spawnP');
const swcBinPath = '../node_modules/@swc/cli/bin/swc.js';

async function createSwcrcFile (tmpdir, pluginPath, isClient) {
  const swcrc = `{
    "jsc": {
        "target": "es2018",
        "keepClassNames": false,
        "parser": {
            "jsx": true,
            "syntax": "ecmascript"
        },
        "experimental": {
            "plugins": [
                [
                    "${pluginPath}",
                    { "isClient": ${isClient} }
                ]
            ]
        }
    }
}
`
  const path = resolve(tmpdir, `swcrc-${isClient ? 'client' : 'server'}.json`)
  await  writeFile(path, swcrc);
  return path;
}

async function exists (path) {
  return access(path, F_OK)
    .then(_ => true)
    .catch(_ => false)
}

async function runSwc (config, filename) {
  const compiledModule = await spawnP(swcBinPath, ['--config-file', config, filename]);
  return compiledModule.slice("Successfully compiled 1 file with swc.".length)
}

module.exports.replaceServiceCalls = async (tmpdir, inputFilename, isClient, swcPluginPath) => {
  const swcrcFile = await createSwcrcFile(tmpdir, swcPluginPath, isClient)
  return {
    name: 'rathernot-swc-compilation',
    setup(build) {
      const rootFileDir = parse(resolve('.', inputFilename)).dir;
      build.onResolve({ filter: /^[.\/]|\.[^.\/]/}, async (args) => {
        const abspath = resolve(args.resolveDir, args.path);
        if (abspath.indexOf('node_modules') === -1) {
          //look for tsx > ts > jsx > js
          // this will blow up for a thousand reasons
          const found = await Promise.all(['','.tsx', '.ts', '.jsx', '.js']
            .map(ext => exists(abspath + ext).then(b => b ? ext : false)))
          const ext = found.filter(f => f !== false)[0];
          if (ext === undefined) {
            console.error(`couldn't find module for ${abspath}`)
          }
          return {
            path: abspath + ext,
            namespace: 'relative-files'
          }
        }
      });

      build.onLoad({ filter: /.*/, namespace: 'relative-files' }, async (args) => {
        let text = await runSwc(swcrcFile, args.path);
        if (args.path.indexOf('../rn')> -1) {
          console.log(args.path)
          console.log(text)
        }
        return {
          contents: text,
          resolveDir: parse(args.path).dir,
          loader: 'js',
        }
      })
    },
  }
};
