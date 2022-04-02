process.env['RATHERNOT_BUILDING'] = 'true';
import {
  parseForms,
  UserApplication
} from '../../../common/application'
import webpack from 'webpack';
import { spawn } from 'child_process';
//@ts-ignore
import { getPackin, packUserSpace } from './adventures-in-webpack.js';
//@ts-ignore
import { getClientWebpack } from './client-webpack.js';
import { codeGen } from './client-code-gen';
import { cp, mkdtemp, readFile, writeFile, copyFile, rename, symlink } from 'fs/promises';
import { resolve, parse, relative, basename, extname } from "path";
import { tmpdir } from 'os';
import { ServiceCollector } from './service-collector';
import chalk from 'chalk';
//@ts-ignore
import * as cliSpinner from 'cli-spinner';
const Spinner = cliSpinner.Spinner;

//todo: use monads or something
//todo: parse args
//todo: help
async function cli () {
  try {
    const args = parseArgs();
    const workingDir =  await spinOn(mkdtemp(resolve(tmpdir(), 'rnc')), 'creating temp dir');
    console.log(chalk.green(` ➡ ${workingDir}`));
    await linkNodeModules(workingDir);
    await spinOn(tsCompile(args, workingDir), 'compiling user typescript');
    const collector = await spinOn(parseUserCode(workingDir), 'parsing user files');
    // console.log(collector.getState())
    await spinOn(packClient(collector, args, workingDir), 'packing client');
    await spinOn(genServer(collector, workingDir), 'generating server');
    // await spinOn(pack(getPackin(collector, workingDir)), 'packing server');
    const dockerName = basename(args, extname(args)).toLowerCase().replace(' ', '_')
    await spinOn(build(dockerName, workingDir), `building docker image '${dockerName}'`);
    console.log('running docker');
    await run(dockerName);
  } catch (e) {
    //todo: do better
    console.error('');
    console.error(e);
    process.exit(1);
  }
}

async function spinOn<T> (work: Promise<T>, message: string): Promise<T> {
  var spinner = new Spinner('%s ' + message);
  spinner.setSpinnerString("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏");
  spinner.start();
  try {
    const r = await work
    spinner.stop(true);
    console.log(chalk.green(`✔ ${message}`));
    return r;
  } catch (e) {
    spinner.stop(true);
    console.log(chalk.red(`✖ ${message}`));
    throw e;
  }
}

async function linkNodeModules (workingDir: string) {
  await cp(resolve(__dirname, 'package-stub.json'), resolve(workingDir, 'package.json'));
  //todo: find the modules!
  return symlink(resolve(__dirname, '../../node_modules'), resolve(workingDir, 'node_modules'));
  // return cp(resolve(__dirname, '../../node_modules'), resolve(workingDir, 'node_modules'), { recursive: true })
}

function parseArgs () {
  return resolve(__dirname, process.argv[2]);
}

function removeFileExtension (filename: string): string {
  const parsed = parse(filename);
  return resolve(parsed.dir, parsed.name);
}

function relativeUserSpace (absolutePath: string, dir: string): string {
  const destination = resolve(dir, removeFileExtension(absolutePath).slice(1))
  const source = resolve(dir, dir.slice(1));
  return relative(source, destination)
}

async function createBuildBootstrapFile (absolutePathEntry: string, dir: string): Promise<string> {
  const registryModuleAbsolutePath
    = resolve(__dirname, 'service-collector.js');
  const fileContents = `
import ServiceCollector from '${relativeUserSpace(registryModuleAbsolutePath, dir)}';
export { default as userspace } from '${relativeUserSpace(absolutePathEntry, dir)}'
export default ServiceCollector;
`;
  const filepath = resolve(dir, 'build-bootstrap.ts')
  await writeFile(filepath, fileContents);
  //todo: let users provide tsconfig
  await copyFile(resolve(__dirname, 'userspace-tsconfig.json'), resolve(dir, 'tsconfig.json'))
  return filepath;
}

async function tsCompile(absolutePathEntry: string, dir: string): Promise<any> {
  const bsFile = await createBuildBootstrapFile(absolutePathEntry, dir);
  return new Promise(function (resolve, reject) {
    const tsc = spawn('tsc', ['--outDir', dir ], { cwd: dir });
    tsc.stderr.on('data', l => console.error(l.toString()));
    tsc.stdout.on('data', l => console.log(l.toString()));
    tsc.on('close', (code) => {
      if (code != 0) {
        reject(`tsc failed with code: ${code}`)
      } else {
        resolve("");//why do I gotta pass something?
      }
    });
  });
}

async function parseUserCode (dir: string): Promise<ServiceCollector> {
  const entry = resolve(dir, dir.slice(1), 'build-bootstrap.js');
  const userSpace = require(entry).default as ServiceCollector;
  return userSpace;
}

//todo: divorce from React
//todo: Page
async function createClientBootstrapFile (entry: string, dir: string) {
  const code = `
import * as React from "react"
import * as ReactDOM from 'react-dom'
import App from './${removeFileExtension(entry).slice(1)}';

ReactDOM.render(App, document.getElementById('root'));`
  await writeFile(resolve(dir, 'client-stub.jsx'), code);
}

async function packClient (collector: ServiceCollector, entryFile: string, dir: string): Promise<any> {
  // create that entry file
  // await copyFile(resolve(__dirname, 'client-stub.jsx'), resolve(dir, 'client-stub.jsx'))
  await createClientBootstrapFile(entryFile, dir);
  const clientCode = collector.codeGenClients();
  // console.log(clientCode)
  await Promise.all(Object.entries(clientCode).map(async ([filename, code]) => {
    await rename(filename, removeFileExtension(filename) + '._service.js');
    await writeFile(filename, code);
  }));
  await pack(getClientWebpack(dir));
  return Promise.all(Object.keys(clientCode).map(async (filename) => {
    await rename(removeFileExtension(filename) + '._service.js', filename);
  }));
}

async function pack (packs: any[]) {
  return new Promise(function (resolve, reject) {
    webpack(packs, (err: any, stats: any) => {
      if (err) {
        reject(err)
      } else {
        const st = stats.toJson('errors-warnings');
        // const st = stats.toJson()
        // console.log(st.children[0].chunks[0].modules)
        if (st.errors.length > 0) {
          reject(stats.toString())
        } else {
          resolve([])
        }
      }
    });
  })
}

async function genServer (collector: ServiceCollector, dir: string) {
  const serverFiles = Object.keys(collector.codeGenClients())
    .map(filename => removeFileExtension(filename).replace(dir, '.'))
    .map(fn => `'${fn}'`)
    .join(', ');
  await writeFile(resolve(dir, 'service-juice.js'), `module.exports = {
    files: [${serverFiles}],
    collector: '.${resolve(__dirname, 'service-collector')}'
  }`)
  /*
  The server-stub file is created by:
../../node_modules/.bin/esbuild server.ts --bundle --outfile=server-stub.js --platform=node --external:./service-juice.js
  */
  await copyFile(resolve(__dirname, './server-stub.js'), resolve(dir, 'server.js'));
  await copyFile(resolve(__dirname, 'Dockerfile'), resolve(dir, 'Dockerfile'));
}

async function build (name: string, dir: string) {
  return new Promise(function (resolve, reject) {
    const dockerBuild = spawn('docker', ['build', '-t', name, dir]);
    dockerBuild.stderr.on('data', l => console.error(l.toString()));
    dockerBuild.on('close', (code) => {
      if (code != 0) {
        reject(`docker build failed with code: ${code}`)
      } else {
        resolve("");//why do I gotta pass something?
      }
    });
  });
}

async function run (name: string) {
  return new Promise(function (resolve, reject) {
    const dockerRun = spawn('docker', ['run', '-p', '3000:3000', name]);
    dockerRun.stdout.on('data', l => console.log(l.toString()));
    dockerRun.stderr.on('data', l => console.error(l.toString()));
    dockerRun.on('close', code => {
      if (code != 0) {
        reject();
      } else {
        resolve("");//why do I gotta pass something?
      }
    })
  })
}

cli()
