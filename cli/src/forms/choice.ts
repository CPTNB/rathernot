import { AtLeastTwo } from '../../../common/types';
import { FormFieldType, Validator } from './field-types';

type EligibleChoiceTypes = string | number | boolean
type ChoiceOptions = { todo: string } | AtLeastTwo<EligibleChoiceTypes>
class ChoiceValidator extends Validator<ChoiceOptions> {
  constructor(private options: ChoiceOptions) { super() }
  validate(): boolean {
    //todo; move to different file
    return true;
  }
  getOptions () {
    return {
      ...this.options,
      formFieldType: 'Choice'
    }
  }
}
const Choice = (o: ChoiceOptions) =>
  new FormFieldType<ChoiceOptions, ChoiceValidator>(new ChoiceValidator(o))

export {
  Choice,
  ChoiceOptions
};
