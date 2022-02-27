import { Discernable, getFieldsOfType } from '../../../common/types';
const FORM_FIELD_DESCRIMINATOR = '#rn_FormFieldType'

type GenericOptions = {
  formTypeName: string
}

abstract class Validator<Options> {
  constructor(protected options: Options & GenericOptions) {}
  abstract validate(): boolean
  getOptions(): Options { return this.options }
}

interface FormField extends Discernable {
  validate(): boolean
  getOptions(): any
}

class FormFieldType<O, V extends Validator<O>> implements FormField {
  public descriminator = FORM_FIELD_DESCRIMINATOR;
  constructor (private validator: V) {}
  validate(): boolean { return this.validator.validate() }
  getOptions(): O { return this.validator.getOptions() }
}

function getFormFields<T extends object>(input: T): [ keyof T, FormField ][] {
  return getFieldsOfType<FormField, T>(input, FORM_FIELD_DESCRIMINATOR)
}

export {
  FormFieldType,
  Validator,
  getFormFields }
