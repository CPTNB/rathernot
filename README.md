# 𝐓𝐡𝐞 𝐑𝐚𝐭𝐡𝐞𝐫𝐧𝐨𝐭 𝐖𝐞𝐛𝐚𝐩𝐩 𝐂𝐨𝐦𝐩𝐢𝐥𝐞𝐫 & 𝐎𝐒
Write some (j|t)s(x)? files, get a container with a webapp inside

## Web applications redefined in 4 syscalls

| Rathernot syscall | Web Concepts |
| ----- | --------- |
| Service | Node/Deno Server, SSR, Bundling, Splitting, API, AJAX |
|Page| Routing, URLs, Links|
|Asset| Serving Assets, Linking, CDNs, Compression, MIME types, Progressive Images|
|Memory|Caching, Cookies, Local Storage, Client State|

### Example message drop app:
An application that drops a message on a queue:

App.tsx:
```tsx
import React from 'react'
import Sqs from './AWS';

const Application = () => <>
  <h1>hello world</h1>
  <button onClick={() => Sqs.sendMessage({
    an: 'object'
  }, "arn:aws:sqs:us-west-2:772384015957:RN_test_queue")}>click me</button>
</>

export default Application();
```

AWS.ts:
```ts
import { Service } from 'rathernot';
import { SQS } from 'aws-sdk'
const sqs = new SQS();

class Sqs {
  async sendMessage(content: object, queueUrl: string) {
    return new Promise(function(resolve, reject) {
     sqs.sendMessage({
       MessageBody: JSON.stringify(content),
       QueueUrl: queueUrl
     }, (err, res) => {
       if (err) {
         reject(err)
       } else {
         resolve(res);
       }
     });
    });
  }
}

export default Service(new Sqs());
```

Run:
```sh
$ rnac App.tsx
✔ compiling user typescript
✔ parsing user files
✔ packing client
✔ generating server
✔ building docker image 'app'
running docker
Server listening at http://0.0.0.0:3000
```

In this example, the rathernot compiler compiles your typescript, identifies the Sqs class as 'service' code and generates two bundles:
- a 'traditional' 'client' bundle that drives a single page application 
- a code generated service bundle that drives a node webserver at runtime

The AWS SDK is included in the service bundle, but not the client bundle.  Rathernot injects a lightweight web 'operating system' that handles communication between the generated SPA and server.

## Rathernot Core Objectives

- Create a platform frontend developers can target that abstracts over the distributed nature of the frontend, allowing them to build, distribute, consume, and run atomic applications

- Push performance decisions (ex: SSR, minification, bundling, transport protocol) to the compiler & OS
