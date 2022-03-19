import { AsyncForm, AsyncDelivery } from '../delivery/index'
import { getFieldsOfType } from '../../../common/types'
import { provisioningRequest } from '../../tst/types/SimpleAsyncForm';
import * as path from 'path';
import { copyFile, writeFile, mkdir } from 'fs/promises';
import webpack from 'webpack';
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
}

const packs = getPackin(parseFields('Test case', [new TestCase()]));
webpack(packs, (err: any, stats: any) => {
  process.stdout.write(stats.toString() + '\n');
  if (err) {
    process.stderr.write(err);  
  }
})
