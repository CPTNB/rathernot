import fastify from 'fastify'
// this just builds the right dist structure
import { Discernable } from '../../common/types' 
const server = fastify()

server.get('/ping', async (request, reply) => {
  return 'pong\n'
});

server.get('/health', async (request, reply) => {
  return 'ok\n'
});

server.get('/', async (request, reply) => {
  return [...Array(5000).keys()].map(_ => '👩‍💻👷‍♀️🚧').join('')
});

server.get('*', async (request, reply) => {
  return JSON.stringify({
    headers: request.headers,
    url: request.url
  }, null, 2);
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
