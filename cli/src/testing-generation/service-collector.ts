import { basename, extname } from 'path';

//todo: add namespaces
type ServiceFunction = {
  serviceId: string,
  fnName: string,
  fn: Function
}

type ListenerFunction = (path: string, fn: Function) => void

type ServiceCollector = {
  addService(obj: object, filename: string): void
  codeGenClients(): { [key:string]: string }
  acceptListener(listener: ListenerFunction): void
}

const notFunctions = new Set([
  'constructor',
  '__defineGetter__',
  '__defineSetter__',
  'hasOwnProperty',
  '__lookupGetter__',
  '__lookupSetter__',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'valueOf',
  'toLocaleString'
]);
function getAllFunctions(input: any) {
  const props = [];
  let obj = input;
  do {
    props.push(...Object.getOwnPropertyNames(obj));
  } while (obj = Object.getPrototypeOf(obj));
  
  return Array.from(new Set(props))
    .filter(e => typeof input[e] === 'function')
    .filter(e => !notFunctions.has(e))
}

class RouteAdder {
  private routesAdded: Set<string> = new Set();
  constructor(private listener: ListenerFunction) {}
  add(path: string, fn: Function) {
    if (!this.routesAdded.has(path)) {
      this.listener(path, fn);
      this.routesAdded.add(path);
    }
  }
}

//todo: this probably needs to be more explicit
//todo: add namespaces
function getIdentifier (obj: object, filename: string): string {
  return basename(filename, extname(filename));
}

function getPath (sfn: ServiceFunction): string {
  return `/api/${sfn.serviceId}/${sfn.fnName}`;
}

function getFetcher(sfn: ServiceFunction) {
  return `(...args) => fetch('${getPath(sfn)}', {
      method: "POST",
      headers: [['Content-Type', 'application/json']],
      body: JSON.stringify(args)
    })`
}

// assume: all fns are from the same serviceId
function getCodeFor (sfns: ServiceFunction[]): string {
  return `
module.exports = {
  ${sfns.map(sfn => `${sfn.fnName}: ${getFetcher(sfn)}`).join(',\n')}
};
`;
}

class BuildServiceCollector implements ServiceCollector {
  private adder: RouteAdder;
  private services: ServiceFunction[];

  addService(serviceObj: object, filename: string) {
    let serviceFns: ServiceFunction[];
    const functionNames = getAllFunctions(serviceObj);
    const identifier = getIdentifier(serviceObj, filename);

    this.services = (this.services || [])
      .concat(...(functionNames || [])
        .map(fnName => [identifier, fnName, serviceObj[fnName]]));

    this.listenToServices()
  }

  codeGenClients (): { [serviceId:string]: string } {
    const map = (this.services || [])
      .reduce((idMap, sfn) => {
        idMap[sfn.serviceId] = 
          (idMap[sfn.serviceId] || []).concat(sfn)
        return idMap;
      }, {});

    Object.keys(map)
      .forEach(serviceId =>
        map[serviceId] = getCodeFor(map[serviceId]));

    return map;
  }

  acceptListener(listener: ListenerFunction) {
    this.adder = new RouteAdder(listener);
    this.listenToServices()
  }

  private listenToServices() {
    if (this.adder !== undefined) {
      (this.services || []).forEach(s =>
        this.adder.add(getPath(s), s.fn))
    }
  }
}

const theSingleCollector = new BuildServiceCollector();

export default theSingleCollector;
