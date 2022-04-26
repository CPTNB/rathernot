# 𝐓𝐡𝐞 𝐫𝐚𝐭𝐡𝐞𝐫𝐧𝐨𝐭 𝐖𝐞𝐛 𝐋𝐢𝐧𝐤𝐞𝐫
Rathernot takes ***all*** your web files and smushes them into a single executable binary.  It's a bundle bundler (or "linker" if you don't want to sound crazy).

There is no server, there is no client.  You just write code and rathernot figures out where to run your code--in the browser or on the server.  Rathernot does this by analyzing your code with SWC compiler extensions and injecting in a thin "operating system" that stitches together your client and server code via http requests.

An example:

```js
import { Service } from 'rathernot';

const serviceLogger = Service({
  log: async (str) => {
    console.log(`Service logging str from client: ${str}`);
  }
});

async function main (root) {
  await serviceLogger.log('a client accessed the site!');
  const text = document.createTextNode("I logged something!");
  const header = document.createElement("h1");
  header.appendChild(text);
  root.appendChild(header);
}
```
In this example we print a simple message in the browser while logging a message on the server.  The server logging code is split off from the rest of the program and only runs inside node.

A more realistic example can be seen in examples/filesystem, which is a simple browser based file system explorer.

## How does it work?
Rathernot uses SWC's rust plugin API to "color" your code as either server or client.  Then it passes the client and server code to esbuild, which constructs a client and server bundle.  Then rathernot takes those two bundles and wraps them inside a thin "web operating system" and virtual filesystem inside the output .rn file.

The output "binary" is just a javascript file with a node #!.

## Running it
Right now you have to build some pieces from source:
requires: node (16ish+), rust/cargo(1.58ish+)
inside linker/: ```npm install```
inside linker/swc/service-injection/: ```cargo install``` (maybe?? I am not good with rust?)
inside linker/: ```npm run build```
(you may need to ```chmod +x build.sh``` first)

Then:
```node linker/cli/index.js examples/logger.js && ./logger.rn```
go to [the app](http://localhost:3000)
Note: you can just execute the .rn file because it has a #! pointing to your node binary.  You should  ```node ./logger.rn``` in deployed environments.  (or better yet, use a daemon)

## Why?
The front end web as it exists today requires *all users* to build a heterogeneous distributed system (client and server).  This has a few very bad consequences:
- building even trivial web apps is complicated (multiple files, technologies, platforms...)
- deploying web apps is complicated
- users can't share web apps because of the complication of distributing a client and a server.  This has effectively meant users do not share web apps, only component libraries.

Rathernot provides a platform users can target to produce single binaries that can be built, run, and distributed using dead simple techniques.

It's also really cool :D

## Todo list:

### Syscalls
- Environment (provide environment variables)
- Secrets (provide environment variables, better)
- Lib (or some way to build a "library" instead of an "app"; probably mutually exclusive with "main") requires namespacing
- Service state / Service closures (cookies, browser storage)
- Include (some way to bring in static resources)

### Optimizations
- CDN optimization (don't bundle dumb things to bundle like react)
- server externals (identify client-only deps and don't bundle them)

### CLI
- config overrides for:
  - esbuild
  - swc
  - rathernot
- supply env in CLI (port=4000)

### RNOS
- better error handling
- stack traces
- source maps
- https / certs

### Docs
- docs

### Testing
- OSX
- Windows
- integration test
- Typescript

### Publishing
- npm build & install story
- contributing guidelines
- discord

## Bugs
- mime types
- esbuild warnings when using imports that have no export
- empty responses from server crash rnos client json parsing
