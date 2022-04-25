const { writeFile, readFile, chmod, mkdtemp, access, F_OK } = require('fs/promises');
const { resolve, parse } = require('path');
const { tmpdir } = require('os');
const { spawn } = require('child_process');
const { build } = require('esbuild');
const inputFilename = process.argv[2];
const swcBinPath = 'node_modules/@swc/cli/bin/swc.js';

async function exists (path) {
  return access(path, F_OK)
    .then(_ => true)
    .catch(_ => false)
}

async function spawnP (command, args = []) {
  return new Promise(function (resolve, reject) {
    var allOutputs = []
    const proc = spawn(command, args);
    proc.stderr.on('data', l => console.error(l.toString()));
    proc.stdout.on('data', l => allOutputs.push(l.toString()));
    proc.on('close', (code) => {
      if (code != 0) {
        reject(`${command} failed with code: ${code}`)
      } else {
        resolve(allOutputs.join('\n'));
      }
    });
  });
}

async function runSwc (config, filename) {
  const compiledModule = await spawnP(swcBinPath, ['--config-file', config, filename]);
  return compiledModule.slice(38)// removes Successfully compiled 1 file with swc
}

async function getShebang () {
  try {
    const nodeBinary = await spawnP('which', ['node']);
    return Buffer.from(`#! ${nodeBinary} \n`);
  } catch (e) {
    return Buffer.from('');
  }
}

const types = {
  '.js': "'Content-Type', 'application/javascript; charset=utf-8'",
  '.html': "'Content-Type', 'text/html; charset=utf-8'",
  '': "'Content-Type', 'text/html; charset=utf-8'"
}

function getMimetype (ext) {
  return types[ext] || types['.js'];
}

const dataSerializationFormat = 'hex';
async function createVfsBuffs (vfs) {
  await Promise.all(
    Object.entries(vfs)
      .map(([vfsName, filepath]) => readFile(filepath)
        .then(d => Promise.resolve(vfs[vfsName] = d))));


  const vfsBufs = [Buffer.from('const vfs = { \n')];
  for(filename in vfs) {
    vfsBufs.push(Buffer.from(`  '${filename}': { mime: [${getMimetype(parse(filename).ext)}], buf: Buffer.from('`));
    vfsBufs.push(Buffer.from(vfs[filename].toString(dataSerializationFormat)));
    vfsBufs.push(Buffer.from(`', '${dataSerializationFormat}') },\n`));
  }
  vfsBufs.push(Buffer.from('};\n'));
  return vfsBufs;
}

//todo: more
const nodeStl = new Set(['fs/promises', 'path'])

let nodeExternals = {
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
}

let replaceServiceCalls = (isClient) => ({
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
          namespace: 'userspace'
        }
      }
    });

    // filter is any relative path (skip node_modules)
    build.onLoad({ filter: /.*/, namespace: 'userspace' }, async (args) => {
      let text = await runSwc(
        resolve('.', `swcrc-${isClient ? 'client' : 'server'}.json`),
        args.path);
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
});

async function runEsBuild (tmpdir) {
  const clientBundle = build({
    entryPoints: [inputFilename],
    bundle: true,
    // minify: true,
    // sourcemap: true,
    outfile: resolve(tmpdir, 'client.js'),
    plugins: [nodeExternals, replaceServiceCalls(true)],
  }).catch(() => process.exit(1));

// don't bundle react
// don't run the plugin on node_modules
  const serviceBundle = build({
    entryPoints: [inputFilename],
    bundle: true,
    platform: 'node',
    outfile: resolve(tmpdir, 'server.js'),
    plugins: [replaceServiceCalls(false)],
    // todo: figure out how to do this
    // external: ['react', 'react-dom'],
  }).catch(() => process.exit(1));

  return Promise.all([clientBundle, serviceBundle]);
}

async function rathernot () {
  const start = Date.now()
  const destFile = `${parse(inputFilename).name}.rn`;
  const tmp = await mkdtemp(resolve(tmpdir(), 'rn'));

  await runEsBuild(tmp);

  const vfs = {
    '/': resolve('.', 'index.html'),
    '/client.js': resolve(tmp, 'client.js'),
  }

  const [
    vfsBuffs,
    shebang,
    userspaceServer,
    rnosServer
  ] = await Promise.all([
    createVfsBuffs(vfs),
    getShebang(),
    readFile(resolve(tmp, 'server.js')),
    readFile(resolve('.', 'THE_SERVER.js'))
  ]);

  const allBuffs = [];

  allBuffs.push(shebang);
  for(let i = 0; i < vfsBuffs.length; i++) {
    allBuffs.push(vfsBuffs[i]);
  }
  allBuffs.push(userspaceServer);
  allBuffs.push(rnosServer);

  await writeFile(destFile, Buffer.concat(allBuffs));
  await chmod(destFile, 0o755);
  const end = Date.now()
  console.log(`created ${destFile} in ${end - start}ms`);
}

rathernot();
