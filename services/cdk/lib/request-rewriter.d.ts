import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
export declare class RequestRewriterStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps);
    createRequestRewriter(bucketName: string, bucketUrl: string): void;
}
