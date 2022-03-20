import {
  parseForms,
  UserApplication
} from '../../../common/application'
import webpack from 'webpack';
import { spawn } from 'child_process';
import TestCase from './TestCase';
//@ts-ignore
import { getPackin } from './adventures-in-webpack';
import { mkdtempSync } from 'fs';
import { resolve } from "path";
import { tmpdir } from 'os';

// get the CLI input

async function cli () {
  const workingDir =  mkdtempSync(resolve(tmpdir(), 'rnc'));
  console.log(`✔ ${workingDir}`)
  const UI = await parse(TestCase, workingDir);
  console.log("✔ parse")
  const dockerName = UI.name.toLowerCase().replace(' ', '_')
  await pack(UI, workingDir);
  console.log(`✔ pack`)
  await build(dockerName, workingDir);
  console.log(`✔ docker build image ${dockerName}`);
  await run(dockerName);
}

async function parse (app: object, dir: string): Promise<UserApplication> {
  //todo: compile the input into the tmpdir
  return parseForms(app.constructor.name, [app]);
}

async function pack (UI: UserApplication, dir: string) {
  return new Promise(function (resolve, reject) {
    webpack(getPackin(UI, dir), (err: any, stats: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats)
        // console.log(`successfully built ${app.name}`)
        // dockerBuildNRun(app.name.toLowerCase().replace(' ', '_'));
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
