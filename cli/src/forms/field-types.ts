import { Discernable, getFieldsOfType } from '../../../common/types';
import { MakeADT } from 'ts-adt/MakeADT';
const FORM_FIELD_DESCRIMINATOR = '#rn_FormFieldType'

type GenericOptions = {
  formFieldType: string
}

abstract class Validator<Options> {
  // constructor(protected options: Options ) {}
  abstract validate(): boolean
  abstract getOptions(): Options & GenericOptions
}

interface FormField extends Discernable {
  validate(): boolean
  getOptions(): any
  getType(): string
}

class FormFieldType<O, V extends Validator<O>> implements FormField {
  public descriminator = FORM_FIELD_DESCRIMINATOR;
  constructor (private validator: V) {}
  validate(): boolean { return this.validator.validate() }
  getOptions(): O { return this.validator.getOptions() }
  getType(): string { return this.validator.getOptions().formFieldType }
}

function getFormFields<T extends object>(input: T): [ keyof T, FormField ][] {
  return getFieldsOfType<FormField, T>(input, FORM_FIELD_DESCRIMINATOR)
}

type foo = MakeADT<
  "object-property",
  {
    formField: FormField
}>

export {
  FormFieldType,
  Validator,
  getFormFields }
