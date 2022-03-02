import { Construct } from 'constructs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps } from 'aws-cdk-lib';
export declare class RathernotStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps);
    createTaskRole(): Role;
    createFrontendResources(taskRole: Role): void;
    createBackendResources(taskRole: Role): void;
    createFargateTask(taskRole: Role): void;
}
