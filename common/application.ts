import { getFieldsOf } from './types'
//@ts-ignore
const { get } = require('/home/ec2-user/rn/cli/node_modules/stack-trace');
import Registry, { RegistryState } from './registry';

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

type AppForm<FormType> = FormType & {
  _rn_node_type: 'form'
}

type UserForm = {
  onSubmit: (instance: object) => void
}

export function Form<FormType extends UserForm>(service: FormType): AppForm<FormType> {
  return {
    ...service,
    _rn_node_type: 'form'
  }
}

type FirstWhenSecondExists<K, V> = V extends never ? never : K

//todo: restrict this to just async functions
type OnlyFunctionsOf<T> = {
  [Property in keyof T as
    FirstWhenSecondExists<Property, Extract<T[Property], Function>>]:
      T[Property]
}

type RuntimeService = object
type Location = 'webserver'|'client';

export type ServiceReturnType<Input> = OnlyFunctionsOf<Input>;

export type TheJuice = {
  registry: RegistryState
}

export function Service<Input extends object>(input: Input): ServiceReturnType<Input> {
  const callingFile = get()[1].getFileName();
  return Registry.addService(input, callingFile);
}
