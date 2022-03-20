import {
  parseForms,
  UserApplication
} from '../../../common/application'
import webpack from 'webpack';
import { spawn } from 'child_process';
//@ts-ignore
import { getPackin, packUserSpace } from './adventures-in-webpack';
import { mkdtempSync } from 'fs';
import { resolve } from "path";
import { tmpdir } from 'os';

async function cli () {
  const args = parseArgs();
  const workingDir =  mkdtempSync(resolve(tmpdir(), 'rnc'));
  console.log(`✔ ${workingDir}`)
  await tsCompile(args, workingDir);
  console.log('✔ ts compile')
  const UI = await parse(workingDir);
  console.log('✔ parse')
  const dockerName = UI.name.toLowerCase().replace(' ', '_')
  await pack(getPackin(UI, workingDir));
  console.log(`✔ pack`)
  await build(dockerName, workingDir);
  console.log(`✔ docker build image ${dockerName}`);
  await run(dockerName);
}

function parseArgs () {
  return resolve(__dirname, process.argv[2]);
}

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
        resolve(stats)
      }
    });
  });
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
