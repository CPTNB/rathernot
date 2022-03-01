import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
export declare class CdkStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps);
    doTheThing(): void;
}
