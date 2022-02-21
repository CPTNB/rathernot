export interface AsyncDelivery {
  //todo?
}

export class AWSQueue implements AsyncDelivery {
  constructor(private arn: string) {}
}
