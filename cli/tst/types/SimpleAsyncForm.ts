import {
  AsyncForm,
  ShortString,
  Choice,
  RuntimeConfig,
  getFormFields
} from 'ui';
import { AWSQueue, AsyncDelivery } from 'delivery';

class ProvisioningRequest implements AsyncForm {

  userName = ShortString();
  userCostCenter = ShortString();
  accountLifespan = Choice(["temporary_1M", "temporary_1Y", "permanent"]);
  ownerEmail = ShortString();
  ownerPosixGroup = ShortString();

  redherring = "string"

  //where we deliver the instances
  getDelivery (config: RuntimeConfig): AsyncDelivery {
    const deliveryQueue = config.stage.isProduction()
      ? "aws.sqs.arn.production.amazone.com"
      : "aws.sqs.arn.beta.amazone.com"
    return new AWSQueue(deliveryQueue);
  }
}

describe('async form', () => {
  it ('should parse form fields', () => {
    const formFields = getFormFields(new ProvisioningRequest())
    const fieldNames = formFields.map(f => f[0]);
      expect(fieldNames).toEqual([
        'userName',
        'userCostCenter',
        'accountLifespan',
        'ownerEmail',
        'ownerPosixGroup']);
  })
})
