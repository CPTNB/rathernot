import fastify from 'fastify'
import fastifyStatic from 'fastify-static';
import * as path from 'path';
import { UserApplication } from '../../../../common/application';
//@ts-ignore
import * as thejuice from './thejuice';
const UI: UserApplication = thejuice;


const server = fastify();

const indexText: string = `<html>
<head>
<title>${UI.name}</title>
</head>
<body>
<div id="root"></div>
<script>UI=${JSON.stringify(UI)}</script>
<script crossorigin src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
<script src="./client.js"></script>
</body>
</html>
`

server.register(fastifyStatic, {
  root: path.resolve(__dirname, './client')
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

Object.entries(UI.forms).forEach(([name, form]) => {
  server.post(`/${name}`, async (request, reply) => {

    //todo: execute back-end
    console.log(request.body)
    return 'ok'
  });
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
