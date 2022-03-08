import {
  getFormFields
} from '../forms';
import {
  AsyncForm
} from '../delivery';

export type RatherNotUIDescriptor = AsyncForm

export type RatherNotUI = {
  type: "#rn-ui"
  // validate: () => todo
  serialize: () => string
}

export default function RatherNot(ui: RatherNotUIDescriptor): RatherNotUI {
  return new RatherNotUIClass(ui);
}

type FormFieldData = {
  name: string,
  type: string, // todo: make this a union,
  options: object //todo: bring in the options supertype
}

type RatherNotUIData = {
  name: string,
  fields: FormFieldData[]
}

class RatherNotUIClass implements RatherNotUI {
  public readonly type = '#rn-ui';
  constructor(private ui: RatherNotUIDescriptor) {}

  serialize () {
    const fields = getFormFields(this.ui)
      .map(([name, field]): FormFieldData => {
        return {
          name: name,
          type: field.getType(),
          options: field.getOptions()
        }
      });
    const uiData: RatherNotUIData = {
      name: this.ui.constructor.name,
      fields: fields
    }

    return JSON.stringify(uiData);
  }
}
