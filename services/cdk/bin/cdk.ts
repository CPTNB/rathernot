#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RathernotStack } from '../lib/cdk-stack';
import { RequestRewriterStack } from '../lib/request-rewriter';

const app = new cdk.App();
const rathernot = new RathernotStack(app, 'RathernotStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: '772384015957', region: 'us-west-2' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

const taskRole = rathernot.createTaskRole();
rathernot.createFargateTask(taskRole);
rathernot.createBackendResources(taskRole);
const requestRewriter = new RequestRewriterStack(app, 'Rathernot-Frontend', {
  env: { account: '772384015957', region: 'us-east-1' }
})
rathernot.createFrontendResources(taskRole);
requestRewriter.createRequestRewriter('rather-not-client-assets', "rather-not-client-assets.s3-us-west-2.amazonaws.com");

