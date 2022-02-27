import { AtLeastTwo } from '../../../common/types';
import { FormFieldType, Validator } from 'ui/field-types';

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
  Choice,
  ChoiceOptions
};
