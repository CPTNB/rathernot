import { Service } from 'rathernot';

//this app logs something every time a client comes to the site.

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
