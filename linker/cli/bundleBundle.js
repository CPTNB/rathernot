const { writeFile, readFile, chmod, mkdtemp, rm } = require('fs/promises');
const { resolve, parse } = require('path');
const { tmpdir } = require('os');
const { build } = require('esbuild');
const { replaceServiceCalls } = require('../esbuild/runSWC');
const { nodeExternals } = require('../esbuild/nodeExternals');
const { rathernotExternals } = require('../esbuild/rathernotExternals');
const swcPluginPath = resolve(__dirname, 'build/service_injection.wasm');
const rnosServerFile = resolve(__dirname, 'build/server.js');

async function runEsBuild (tmpdir, inputFilename) {
  const clientBundle = build({
    entryPoints: [inputFilename],
    bundle: true,
    // minify: true,
    // sourcemap: true,
    outfile: resolve(tmpdir, 'client.js'),
    plugins: [
      await rathernotExternals(true),
      nodeExternals,
      await replaceServiceCalls(tmpdir, inputFilename, true, swcPluginPath)],
  }).catch(() => process.exit(1));

// don't bundle react - how?
  const serviceBundle = build({
    entryPoints: [inputFilename],
    bundle: true,
    platform: 'node',
    outfile: resolve(tmpdir, 'server.js'),
    plugins: [
      await rathernotExternals(false),
      await replaceServiceCalls(tmpdir, inputFilename, false, swcPluginPath)],
    // todo: figure out how to do this
    // external: ['react', 'react-dom'],
  }).catch(() => process.exit(1));

  return Promise.all([clientBundle, serviceBundle]);
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
  const vfsBufs = [Buffer.from('const vfs = { \n')];
  for(filename in vfs) {
    vfsBufs.push(Buffer.from(`  '${filename}': { mime: [${getMimetype(parse(filename).ext)}], buf: Buffer.from('`));
    vfsBufs.push(Buffer.from(vfs[filename].toString(dataSerializationFormat)));
    vfsBufs.push(Buffer.from(`', '${dataSerializationFormat}') },\n`));
  }
  vfsBufs.push(Buffer.from('};\n'));
  return vfsBufs;
}

async function createIndex () {
  const rnosClient = await readFile(resolve(__dirname, '../rnos/client.js'));
  return Buffer.concat([
    Buffer.from('<head></head><body><div id="_RNOS_ROOT"></div><script>\n'),
    rnosClient,
    Buffer.from('</script><script src="./client.js"></script></body>\n')]);
}

module.exports.link = async function link (nodeProcess, inputFilename) {
  const start = Date.now()
  const destFile = `${parse(inputFilename).name}.rn`;
  const tmp = await mkdtemp(resolve(tmpdir(), 'rn'));

  await runEsBuild(tmp, inputFilename);

  const vfs = {
    '/': await createIndex(),
    '/client.js': await readFile(resolve(tmp, 'client.js')),
    //todo: more client files
  }

  const [
    vfsBuffs,
    userspaceServer,
    rnosServer
  ] = await Promise.all([
    createVfsBuffs(vfs),
    readFile(resolve(tmp, 'server.js')),
    readFile(rnosServerFile)
  ]);

  const allBuffs = [];

  allBuffs.push(Buffer.from('#! /usr/bin/env node\n'))//Buffer.from(`#! ${nodeProcess} \n`));
  for(let i = 0; i < vfsBuffs.length; i++) {
    allBuffs.push(vfsBuffs[i]);
  }
  allBuffs.push(userspaceServer);
  allBuffs.push(rnosServer);

  await writeFile(destFile, Buffer.concat(allBuffs));
  await chmod(destFile, 0o755);
  await rm(tmp, { recursive: true });
  const end = Date.now()
  console.log(`created ${destFile} in ${end - start}ms`);
}
