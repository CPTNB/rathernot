// this file is injected into the client bundle at the global scope
// _RNOS_CLIENT and _RNOS_MAIN are injected into userspace code by SWC
const fetcher = async (path, args) => {
  //todo: GET requests if no args?
  return fetch(['api'].concat(path).join('/'), {
      method: "POST",
      headers: [['Content-Type', 'application/json']],
      body: JSON.stringify(args)
      //todo: allow for empty server responses
    }).then(response => response.ok
      ? response.json()
      : response.json().then(b => Promise.reject(b.message)))
};

// Level 9 javascript wizard spell
// What does it produce?  Whatever you want!
const wish = props => new Proxy(async (...args) => fetcher(props, args), {
  get(_, prop) {
    return wish((props || []).concat(prop));
  }
});

_RNOS_CLIENT = (serviceId) => wish([serviceId]);
//todo: something with serviceId
_RNOS_MAIN = (serviceId, mainFn) => {
  mainFn(document.getElementById('_RNOS_ROOT'))
};
