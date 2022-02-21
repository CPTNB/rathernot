import { AtLeastTwo } from '../../../common/types';

type GenericOptions = {
  formTypeName: string
}

abstract class Validator<Options> {
  constructor(protected options: Options & GenericOptions) {}
  abstract validate(): boolean
  getOptions(): Options { return this.options }
}
class FormFieldType<O, V extends Validator<O>> {
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
      ...options,
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


export {
  FormFieldType,
  ShortString,
  ShortStringOptions,
  Choice,
  ChoiceOptions }