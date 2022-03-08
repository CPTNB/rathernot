import { AsyncForm, AsyncDelivery } from '../delivery/index'
import { getFieldsOfType } from '../../../common/types'
import { renderApplication } from './app'
import { provisioningRequest } from '../../tst/types/SimpleAsyncForm';
// import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { copyFile, writeFile, mkdir } from 'fs/promises';
// function getFormFields<T extends object>(input: T): [ keyof T, FormField ][] {
//   return getFieldsOfType<FormField, T>(input, FORM_FIELD_DESCRIMINATOR)
// }

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


// these aren't actually getting used lol
type Choice = {
  _formField_Type: "choice",
  choices: string[]
}

type ShortString = {
  _formField_Type: "shortString"
}

export type FormField = Choice|ShortString
const getFormFields = (input: object) => getFieldsOf<FormField>(input, 'descriminator');

export type UserApplication = {
  title: string,
  fields: {[key:string]: FormField},
  delivery: AsyncDelivery
}

export function parseFields (form: AsyncForm): UserApplication {
  const fields = getFormFields(form);
  return {
    title: 'foo',
    fields: fields.reduce((fieldMap, nextField) =>
      Object.assign(fieldMap, {[nextField[0]]: nextField[1]}), {}),
    delivery: form.getDelivery()
  };
}

async function doTheThing (form: AsyncForm) {
  const ui = parseFields(form)
  const destDir = path.resolve(__dirname, 'output')
  const output = await mkdir(destDir, { recursive: true })
  await copyFile('createServer.js', path.resolve(destDir, 'server.js'))
  await copyFile('app.js', path.resolve(destDir, 'app.js'))
  await writeFile(path.resolve(destDir, 'the-juice.json'), JSON.stringify(ui, null, 2));
}

doTheThing(provisioningRequest)