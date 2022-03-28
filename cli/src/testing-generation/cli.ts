process.env['RATHERNOT_BUILDING'] = 'true';
import {
  parseForms,
  UserApplication
} from '../../../common/application'
import webpack from 'webpack';
import { spawn } from 'child_process';
//@ts-ignore
import { getPackin, packUserSpace } from './adventures-in-webpack.js';
import { mkdtemp, writeFile, copyFile } from 'fs/promises';
import { resolve, parse, relative } from "path";
import { tmpdir } from 'os';
import { RegistryState, Registry }  from '../../../common/registry';
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
    await spinOn(tsCompile(args, workingDir), 'compiling user typescript');
    const registry = await spinOn(parseUserCode(workingDir), 'parsing user files');
    console.log(registry.getState())
    // const dockerName = UI.name.toLowerCase().replace(' ', '_')
    // await spinOn(pack(getPackin(UI, workingDir)), 'packing runtime');
    // await spinOn(build(dockerName, workingDir), `building docker image '${dockerName}'`);
    // console.log('running docker');
    // await run(dockerName);
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
    = resolve(__dirname, '../../../common', 'registry.js');
  const fileContents = `
import Registry from '${relativeUserSpace(registryModuleAbsolutePath, dir)}';
export { default as userspace } from '${relativeUserSpace(absolutePathEntry, dir)}'
export default Registry;
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

async function parseUserCode (dir: string): Promise<Registry> {
  const entry = resolve(dir, dir.slice(1), 'build-bootstrap.js');
  const userSpace = require(entry).default as Registry;
  return userSpace;
  // return parseForms(userSpace.constructor.name, [userSpace]);  
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
