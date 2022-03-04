import { Construct } from 'constructs';
import { Stack, App, StackProps } from 'aws-cdk-lib';
import { Runtime, InlineCode } from 'aws-cdk-lib/aws-lambda';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  Distribution,
  experimental,
  LambdaEdgeEventType
} from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class RequestRewriterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super (scope, id, props);
  }

  createRequestRewriter(bucketName: string, bucketUrl: string) {
    //import the bucket in a non-cross-stack way...
    const bucket = Bucket.fromBucketName(
      this,
      'imported-rather-not-client-assets',
      bucketName,
    );

    const requestRewriter = new experimental.EdgeFunction(this, 'rathernot-url-rewriter', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new InlineCode(lamdaAtEdge(bucketUrl))
    });

    const distribution = new Distribution(this, 'rathernot-ui-distribution', {
      defaultBehavior: {
        origin: new S3Origin(bucket),
        // edgeLambdas: [
        //   {
        //     functionVersion: requestRewriter.currentVersion,
        //     eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
        //   }
        // ],
      },
    });
  }
}

// λ@Edge 555.rathernot.io/123.html -> s3.bucket.aws.com/555/123.html
function lamdaAtEdge (bucketUrl: string): string {
  return `const rathernot = '.rathernot.io';
const s3Bucket = '${bucketUrl}';

exports.handler = (event, context, callback) => {
const request = event.Records[0].cf.request;
const headers = request.headers;
const hostname = "" + headers.host[0].value;
const tldloc = hostname.indexOf(rathernot) - 1;
headers.host[0].value = s3Bucket;
var i = tldloc;
var origin;
if (tldloc > -1) {
  while(i > 0 && hostname.charAt(i) !== '.') {
    i--;
  }
  request.uri = '/' + hostname.slice(i, tldloc + 1) + request.uri
}
return callback(null,request);
};`
}
