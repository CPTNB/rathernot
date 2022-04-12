
const server = require('fastify')();
const port = process.argv[2] || 3000;

Object.keys(vfs).forEach(filename => {
  server.get(filename, async (request, reply) => {
    reply
      .status(200)
      .header(...vfs[filename].mime)
      .send(vfs[filename].buf);
  })
});

server.post('/api*', async (request, reply) => {
  const paths = request.url.slice(1).split('/').slice(1);
  const result = await Service._call(paths, request.body);
  reply
    .status(200)
    .header('Content-Type', 'application/json')
    .send(JSON.stringify(result));
});

server.get('/health', async (request, reply) => {
  return 'ok\n'
});

server.listen(port, '0.0.0.0', () => {
  console.log(`server listening on ${port}`);
});
