import { FormFieldType, Validator } from './field-types';

type ShortStringOptions = { todo: string } | undefined
const defaultShortStringOptions = {
  todo: 'foobar'
}

class ShortStringValidator extends Validator<ShortStringOptions> {
  constructor(private options: ShortStringOptions) { super() }

  validate(): boolean {
    //todo; move to different file
    return true;
  }
  getOptions() {
    return {
      ...this.options || defaultShortStringOptions,
      formFieldType: 'ShortString'
    }
  }
}

const ShortString = (o?: ShortStringOptions) =>
  new FormFieldType<ShortStringOptions, ShortStringValidator>(new ShortStringValidator(o))

export {
  ShortString,
  ShortStringOptions
};
