const { writeFile, readFile, chmod, mkdtemp } = require('fs/promises');
const { resolve, parse } = require('path');
const { tmpdir } = require('os');
const { spawn } = require('child_process');
const inputFilename = process.argv[2];

function getSpack (filename, client, tmpdir) {
  return `
  const { config } = require('@swc/core/spack');
  const { resolve } = require('path');


module.exports = config({
    entry: {
        '${filename}': '${resolve('.', inputFilename)}',
    },
    output: {
        path: '${tmpdir}'
    },
    // target: "node",
    options: {
        jsc: {
            target: "es2018",
            keepClassNames: false,
            experimental: {
                plugins: [
                    [
                        resolve('.', 'service_injection.wasm'),
                        { "isClient": ${client} }
                    ]
                ]
            }
        }
    }
});`
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
  '.html': "'Content-Type', 'text/html; charset=utf-8'"
}

function getMimetype (ext) {
  return types[ext] || types['.js'];
}

const dataSerializationFormat = 'hex';
async function getVFSEntry (absoluteFilepath, nopath) {
  const p = parse(absoluteFilepath);
  return [
                    // todo: directories
    Buffer.from(`  '/${nopath ? "" : p.base}': { mime: [${getMimetype(p.ext)}], buf: Buffer.from('`),
    Buffer.from((await readFile(absoluteFilepath))
      .toString(dataSerializationFormat)),
    Buffer.from(`', '${dataSerializationFormat}') },
`)
  ]
}

const configFile = resolve('.', 'spack.config.js')
async function rathernot () {
  const destFile = `${parse(inputFilename).name}.rn`;
  const tmp = await mkdtemp(resolve(tmpdir(), 'rn'))
  await writeFile(configFile, getSpack('client', true, tmp));
  await spawnP('npx', ['spack']);
  await writeFile(configFile, getSpack('server', false, tmp));
  await spawnP('npx', ['spack']);

  const vfsFiles = [resolve('.', 'index.html'), resolve(tmp, 'client.js')];

  const allBuffers = [await getShebang()];
  let vfsEntryBufs;
  allBuffers.push(Buffer.from('const vfs = { \n'))
  for(let i = 0; i < vfsFiles.length; i++) {
    vfsEntryBufs = await getVFSEntry(vfsFiles[i], parse(vfsFiles[i]).base === 'index.html')
    for (let j = 0; j < vfsEntryBufs.length; j++) {
      allBuffers.push(vfsEntryBufs[j]);
    }
  }
  allBuffers.push(Buffer.from('};\n'))
  allBuffers.push(await readFile(resolve(tmp, 'server.js')))
  allBuffers.push(await readFile(resolve('.', 'THE_SERVER.js')))

  await writeFile(destFile, Buffer.concat(allBuffers));
  await chmod(destFile, 0o755);
}

rathernot();
