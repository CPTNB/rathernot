import { Construct } from 'constructs';
import * as path from 'path';
import {
  Cluster,
  FargateTaskDefinition,
  ContainerImage,
  LogDrivers,
  FargateService,
  Protocol,
  TaskDefinition
} from 'aws-cdk-lib/aws-ecs';
import {
  Role,
  PolicyStatement,
  Effect,
  ServicePrincipal,
  Policy
} from 'aws-cdk-lib/aws-iam';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import {
  ApplicationLoadBalancer
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {
  Vpc
} from 'aws-cdk-lib/aws-ec2';

import { Stack, App, StackProps } from 'aws-cdk-lib';
const containerName = "rathernot-services"

export class RathernotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }

  createTaskRole(): Role {
    return new Role(this, 'rather-not-task-role', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role assumed by rather not service tasks',
    });
  }

  createFrontendResources(taskRole: Role) {
    const bucket = new Bucket(this, 'rn-bucket', {
      bucketName: 'rather-not-client-assets',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });
    taskRole.attachInlinePolicy(new Policy(this, 'client-resources-policy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [bucket.bucketArn],
          actions: ['s3:PutObject'],
        })
      ]
    }));
  }

  createBackendResources(taskRole: Role) {
    const rathernotUIRegistrationTable = new Table(this, 'Table', {
      partitionKey: { name: 'id', type: AttributeType.STRING }
    });

    taskRole.attachInlinePolicy(new Policy(this, 'backend-resources-policy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [rathernotUIRegistrationTable.tableArn],
          actions: ['ddb:PutItem', 'ddb:GetItem'],
        })
      ]
    }));
  }

  createFargateTask(taskRole: Role) {
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
