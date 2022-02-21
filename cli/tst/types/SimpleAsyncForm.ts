import {
  AsyncForm,
  ShortString,
  Choice,
  RuntimeConfig,
  FormFieldType
} from '../../src/ui/index';
import { AWSQueue, AsyncDelivery } from '../../src/delivery/index';

class ProvisioningRequest implements AsyncForm {

  //form fields
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

console.log(`Making a form with fields:
`)
const x = new ProvisioningRequest()
Object.keys(x)
  .map((k: keyof typeof x) => {
    if (x[k] instanceof FormFieldType) {
      const v = x[k] as FormFieldType<any, any>
      const options = v.getOptions()
      console.log('\n')
      console.log(`${k}, which is a ${options.formTypeName} with configuration:`)
      console.log(options)
    }
  })