import { getFieldsOf } from './types'

type ChoiceFormField = {
  _formField_Type: "choice",
  choices: string[]
}

export function Choice (options?: string[]): ChoiceFormField {
  return {
    _formField_Type: "choice",
    choices: options || []
  }
}

type ShortStringFormField = {
  _formField_Type: "shortString"
}

export function ShortString (): ShortStringFormField {
  return {
    _formField_Type: "shortString"
  }
}

export type FormField =
  ChoiceFormField
  | ShortStringFormField

export const getFormFields = (input: object) =>
  getFieldsOf<FormField>(input, '_formField_Type');

type Form = {
  fields: {[key:string]: FormField}
  // delivery: AsyncDelivery
}

export type UserApplication = {
  name: string,
  forms: {[key:string]: Form}
}

export function parseForms (name: string, forms: object[]): UserApplication {
  const fields = getFormFields(forms[0]);
  return {
    name: name,
    forms: {
      [forms[0].constructor.name]: {
        fields: fields.reduce((fieldMap, nextField) =>
      Object.assign(fieldMap, {[nextField[0]]: nextField[1]}), {})
      }
    },
  };
}
