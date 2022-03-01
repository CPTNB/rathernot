import { Construct } from 'constructs';
import * as path from 'path';
import {
  Cluster,
  FargateTaskDefinition,
  ContainerImage,
  LogDrivers,
  FargateService,
  Protocol
} from 'aws-cdk-lib/aws-ecs';
import {
  ApplicationLoadBalancer
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {
  Vpc
} from 'aws-cdk-lib/aws-ec2';

import { Stack, App, StackProps } from 'aws-cdk-lib';
const containerName = "rathernot-services"

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.doTheThing();
  }
  doTheThing() {
    const vpc = new Vpc(this, 'Vpc', { maxAzs: 2 });

    const cluster = new Cluster(this, 'Cluster', { vpc });

    const fargateTaskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = fargateTaskDefinition.addContainer(containerName, {
      image: ContainerImage.fromAsset(path.resolve(__dirname, '..', '..')),
      environment: { // clear text, not for sensitive data
        STAGE: 'prod',
      },
      logging: LogDrivers.awsLogs({ streamPrefix: 'ECS' }),
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: Protocol.TCP,
    });

    const ecsService = new FargateService(this, 'Service', {
      cluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 1,
    });

    const lb = new ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
      vpcSubnets: { subnets: vpc.publicSubnets }
    });
    const listener = lb.addListener('Listener', { port: 80 });

    const targetGroup = listener.addTargets('ECS', {
      port: 80,
      targets: [ecsService.loadBalancerTarget({
        containerName: containerName,
        containerPort: 3000
      })],
    });
    targetGroup.configureHealthCheck({
      path: "/health",
    });
  }
}
