import { basename, extname } from 'path';

//todo: add namespaces
type ServiceFunction = {
  filename: string,
  serviceId: string,
  fnName: string,
  fn: Function
}

type ListenerFunction = (path: string, fn: Function) => void

export type ServiceCollector = {
  addService(obj: object, filename: string): void
  codeGenClients(): { [filename:string]: string }
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
  private adder: RouteAdder | undefined;
  private services: ServiceFunction[] = [];

  addService<T extends object> (serviceObj: T, filename: string): OnlyFunctionsOf<T> {
    const functionNames = getAllFunctions(serviceObj) as (keyof T)[];
    const identifier = getIdentifier(serviceObj, filename);

    this.services = (this.services || [])
      .concat((functionNames || [])
        .map(fnName => ({
          filename: filename,
          serviceId: identifier,
          fnName: fnName as string,
          fn: serviceObj[fnName] as unknown as Function
        })));

    this.listenToServices();

    return functionNames.reduce((obj, fnName) => Object.assign(obj, {
      [fnName]: serviceObj[fnName] as unknown as Function
    }) , {} as OnlyFunctionsOf<T> );
  }

  codeGenClients (): { [filename:string]: string } {
    const map = (this.services || [])
      .reduce((idMap, sfn) => {
        idMap[sfn.filename] = 
          (idMap[sfn.serviceId] || []).concat(sfn)
        return idMap;
      }, {} as { [serviceId:string]: ServiceFunction[] });

    const codeMap: { [serviceId:string]: string } = {};

    Object.keys(map)
      .forEach(serviceId =>
        codeMap[serviceId] = getCodeFor(map[serviceId]));

    return codeMap;
  }

  acceptListener(listener: ListenerFunction) {
    this.adder = new RouteAdder(listener);
    this.listenToServices()
  }

  private listenToServices() {
    if (this.adder !== undefined) {
      this.services.forEach(s =>
        this.adder!.add(getPath(s), s.fn))
    }
  }
}

const theSingleCollector = new BuildServiceCollector();

export default theSingleCollector;

type FirstWhenSecondExists<K, V> = V extends never ? never : K

//todo: restrict this to just async functions
export type OnlyFunctionsOf<T> = {
  [Property in keyof T as
    FirstWhenSecondExists<Property, Extract<T[Property], Function>>]:
      T[Property]
}
