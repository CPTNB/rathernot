import fastify from 'fastify'
import fastifyStatic from 'fastify-static';
import * as path from 'path';
// import ServiceCollector from './service-collector';

const server = fastify();

//todo: Page and Resource
const indexText: string = `<html>
<head>
<title>rathernot</title>
</head>
<body>
<div id="root"></div>
<script src="./client.js"></script>
</body>
</html>
`
//<script crossorigin src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"></script>
//<script crossorigin src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"></script>

server.register(fastifyStatic, {
  root: path.resolve(__dirname, './client')
});

//@ts-ignore
const serviceJuice = require('./service-juice.js');
// console.log(serviceFiles);
serviceJuice.files.forEach((f: string) => require(f));

//@ts-ignore
const ServiceCollector = require(serviceJuice.collector).default;
ServiceCollector.acceptListener((path: string, fn: Function) => {
  server.post(path, async (request, reply) => {
    try {
      // todo: this can clearly fail in a billion ways
      const result = fn(...(request.body as Array<unknown>))
      return JSON.stringify(result);
    } catch (e) {
      //todo: error handling
      reply
        .status(500)
        .send((e as any).toString())
    }
  });
});

server.get('/', async (request, reply) => {
  reply
    .status(200)
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(indexText)
})

server.get('/health', async (request, reply) => {
  return 'ok\n'
});

server.listen(3000, "0.0.0.0", (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
});

// docker stuff

async function closeGracefully(signal: any) {
   // console.log(`*^!@4=> Received signal to terminate: ${signal}`)

   await server.close()
   // await db.close() if we have a db connection in this app
   // await other things we should cleanup nicely
   process.exit()
}
// process.on('SIGHUP', closeGracefully)
process.on('SIGINT', closeGracefully)
process.on('SIGTERM', closeGracefully)
