import { Service } from '../rn';
/*
server zone
*/

const serviceLogger = Service({
  log: async (str) => {
    console.log(`Service logging str from client: ${str}`);
  }
});

// const logger = Service(serviceLogger);

/*
client zone
*/
const x = async () => {
  const res = await serviceLogger.log('something to log');
  // console.log(`this is what I got back from the server: ${res}`);
}
x();
