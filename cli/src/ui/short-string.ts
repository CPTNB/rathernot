import { FormFieldType, Validator } from 'ui/field-types';

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

export {
  ShortString,
  ShortStringOptions
};
