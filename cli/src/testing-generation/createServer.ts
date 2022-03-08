import fastify from 'fastify'
import { UserApplication } from './test';
import { renderApplication } from './app'
import * as theJuice from './the-juice.json';
import fastifyStatic from 'fastify-static';
const server = fastify()

server.register(fastifyStatic, {
  root: __dirname
});

server.get('/health', async (request, reply) => {
  return 'ok\n'
});

server.get('/', async (request, reply) => {
  reply
    .code(200)
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(renderApplication(theJuice as unknown as UserApplication))
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
   console.log(`*^!@4=> Received signal to terminate: ${signal}`)

   await server.close()
   // await db.close() if we have a db connection in this app
   // await other things we should cleanup nicely
   process.exit()
}
// process.on('SIGHUP', closeGracefully)
process.on('SIGINT', closeGracefully)
process.on('SIGTERM', closeGracefully)