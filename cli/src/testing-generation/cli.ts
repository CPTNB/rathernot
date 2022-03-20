import {
  parseForms,
  UserApplication
} from '../../../common/application'
import webpack from 'webpack';
import { spawn } from 'child_process';
//@ts-ignore
import { getPackin, packUserSpace } from './adventures-in-webpack.js';
import { mkdtemp} from 'fs/promises';
import { resolve } from "path";
import { tmpdir } from 'os';
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
    const UI = await spinOn(parse(workingDir), 'parsing user files');
    const dockerName = UI.name.toLowerCase().replace(' ', '_')
    await spinOn(pack(getPackin(UI, workingDir)), 'packing runtime');
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

function parseArgs () {
  return resolve(__dirname, process.argv[2]);
}

//todo: this is broken and doesn't actually blow up on type errors
async function tsCompile(absolutePathEntry: string, dir: string): Promise<any> {
  //todo: let users provide tsconfig
  return pack([packUserSpace(absolutePathEntry, dir)]).then(stats => stats)
}

async function parse (dir: string): Promise<UserApplication> {
  // todo: load up the ts ast and do smart things
  const userSpace = require(resolve(dir, 'userspace.js')).default
  //todo: really think about this lol
  return parseForms(userSpace.constructor.name, [userSpace]);
}

async function pack (packs: any[]) {
  return new Promise(function (resolve, reject) {
    webpack(packs, (err: any, stats: any) => {
      if (err) {
        reject(err)
      } else {
        const st = stats.toJson('errors-warnings');
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
