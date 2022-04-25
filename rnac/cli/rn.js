const _service = (thing) => console.log(thing)

async function attemptToCall (props, args) {
  var ptr = registeredObjects[props[0]];
  for (var i =1; i < props.length; i++) {
    if (ptr[props[i]]) {
      ptr = ptr[props[i]];
    } else {
      throw new Error(`I can't find property ${props[i]} on object ${JSON.stringify(ptr, null, 2)}`);
    }
  }
  return ptr(...args);
}

const registeredObjects = {
  //key: serviceId
  //value: registered object
}

_service._RNOS_SERVER = (id, thing) => {
  registeredObjects[id] = thing;
  return thing;
};

_service._call = attemptToCall;

export const Service = _service;

// this is dumb, just manage the path in the filesystem thing
class _URel {
  // todo
  constructor(path) {
      this.p = path
  }
  get() {
    return [window.location.pathname, this.p]
      .filter(x => x !== undefined)
      .join('/')
  }
  concat(segment) {
    return new _URel(segment);
  }
  href() {
    return window.location.origin + window.location.pathname + this.p;
  }
}
const thisURel = new _URel()

export const URel = function () {
  return thisURel.get();
}
URel.concat = (segment) => thisURel.concat(segment);

// export const URel = {
//   toString: () => window.location.pathname,
//   concat: (segment) => window.location.pathname + '/' + segment
// }

