import { AtLeastTwo, Discernable, getFieldsOfType } from '../../../common/types';
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

type ShortStringOptions = { todo: string } | undefined
const defaultShortStringOptions = {
  todo: 'foobar'
}
class ShortStringValidator extends Validator<ShortStringOptions> {
  constructor(options: ShortStringOptions) {
    super({
      ...(options || defaultShortStringOptions),
      formTypeName: 'ShortString'
    })}
  validate(): boolean {
    //todo; move to different file
    return true;
  }
}
const ShortString = (o?: ShortStringOptions) =>
  new FormFieldType<ShortStringOptions, ShortStringValidator>(new ShortStringValidator(o))


type EligibleChoiceTypes = string | number | boolean
type ChoiceOptions = { todo: string } | AtLeastTwo<EligibleChoiceTypes>
class ChoiceValidator extends Validator<ChoiceOptions> {
  // todo move these CTRs into the factory functions
  constructor(options: ChoiceOptions) {
    super({
      ...options,
      formTypeName: 'Choice'
    })}
  validate(): boolean {
    //todo; move to different file
    return true;
  }
}
const Choice = (o: ChoiceOptions) =>
  new FormFieldType<ChoiceOptions, ChoiceValidator>(new ChoiceValidator(o))

function getFormFields<T extends object>(input: T): [ keyof T, FormField ][] {
  return getFieldsOfType<FormField, T>(input, FORM_FIELD_DESCRIMINATOR)
}

export {
  FormFieldType,
  ShortString,
  ShortStringOptions,
  Choice,
  ChoiceOptions,
  getFormFields }
