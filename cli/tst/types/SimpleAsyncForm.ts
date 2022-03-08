import {
  ShortString,
  Choice,
  getFormFields
} from '../../src/forms/index';
import { SQSQueue, AsyncDelivery, AsyncForm } from '../../src/delivery/index';

class ProvisioningRequest implements AsyncForm {

  userName = ShortString();
  userCostCenter = ShortString();
  accountLifespan = Choice(["temporary_1M", "temporary_1Y", "permanent"]);
  ownerEmail = ShortString();
  // ownerPosixGroup = ShortString();

  redherring = "string"

  //where we deliver the instances
  public getDelivery = () =>
    SQSQueue("arn:aws:sqs:us-west-2:772384015957:RN_test_queue")
}

export const provisioningRequest = new ProvisioningRequest();
