import { AsyncForm, AsyncDelivery } from '../delivery/index'
import { getFieldsOfType } from '../../../common/types'
import { provisioningRequest } from '../../tst/types/SimpleAsyncForm';
import * as path from 'path';
import { copyFile, writeFile, mkdir } from 'fs/promises';
import webpack from 'webpack';
import { spawn } from 'child_process';
//@ts-ignore
import { getPackin } from './adventures-in-webpack';

function getFieldsOf<Output>(input: any, discriminatingField: string): [string, Output][] {
  const keys = Object.keys(input);
  return keys.filter(k => {
    if (typeof input !== 'object') {
      return false;
    }
    const value: any = input[k];
    if (value && typeof value[discriminatingField] === 'string') {
      return true
    }
  }).map(k => [k, input[k] as unknown as Output])
}

type ChoiceFormField = {
  _formField_Type: "choice",
  choices: string[]
}

function Choice (options?: string[]): ChoiceFormField {
  return {
    _formField_Type: "choice",
    choices: options || []
  }
}

type ShortStringFormField = {
  _formField_Type: "shortString"
}

function ShortString (): ShortStringFormField {
  return {
    _formField_Type: "shortString"
  }
}

export type FormField =
  ChoiceFormField
  | ShortStringFormField
const getFormFields = (input: object) =>
  getFieldsOf<FormField>(input, '_formField_Type');

type Form = {
  fields: {[key:string]: FormField}
  // delivery: AsyncDelivery
}

export type UserApplication = {
  name: string,
  forms: {[key:string]: Form}
}

export function parseFields (name: string, forms: object[]): UserApplication {
  const fields = getFormFields(forms[0]);
  return {
    name: name,
    forms: {
      [forms[0].constructor.name]: {
        fields: fields.reduce((fieldMap, nextField) =>
      Object.assign(fieldMap, {[nextField[0]]: nextField[1]}), {})
      }
    },
    // delivery: form.getDelivery()
  };
}

class TestCase {
  public MyString = ShortString();
  public MyChoice = Choice(["one", "two", "three"]);
  public AnotherChoice = Choice(["an", "illusion"]);
}

const app = parseFields('Test case', [new TestCase()])

const packs = getPackin(app);
webpack(packs, (err: any, stats: any) => {
  if (err) {
    process.stderr.write(err);  
  } else {
    console.log(`successfully built ${app.name}`)
    dockerBuildNRun(app.name.toLowerCase().replace(' ', '_'));
  }
});

function dockerBuildNRun(name: string) {
  const dockerBuild = spawn('docker', ['build', '-t', name, 'dist']);
  // dockerBuild.stdout.on('data', l => console.log(l.toString()));
  dockerBuild.stderr.on('data', l => console.error(l.toString()));

  dockerBuild.on('close', (code) => {
    if (code != 0) {
      console.error(`docker build failed with code: ${code}`);
    } else {
      const dockerRun = spawn('docker', ['run', '-p', '3000:3000', name]);
      dockerRun.stdout.on('data', l => console.log(l.toString()));
      dockerRun.stderr.on('data', l => console.error(l.toString()));
    }
  });
}
