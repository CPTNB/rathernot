type SQSQueueDelivery = {
  type: "SQS",
  arn: string
}

type SNSTopicDelivery = {
  type: "SNS",
  arn: string
}

export type AsyncDelivery = SQSQueueDelivery | SNSTopicDelivery

class SQSQueueClass implements SQSQueueDelivery {
  public readonly type = "SQS"
  constructor(public arn: string) {}
}

export const SQSQueue = (arn: string) => new SQSQueueClass(arn)

export type AsyncForm = {
  getDelivery(): AsyncDelivery
}
