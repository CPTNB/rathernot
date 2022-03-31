import {
  ServiceReturnType
} from './application'
//@ts-ignore
import { thejuicefile } from './thejuice'

type AsyncFn = (...args: any) => Promise<any>

export type RegistryNode = {
  filename: string,
  functions: {
    [key: string]: {
      service: string,
      fnName: string,
      fn: AsyncFn
    }
  }
}

export type RegistryState = {
  [key: string]: RegistryNode//something
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
//probably restrict this somehow
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

export class Registry {
  private state: RegistryState;
  constructor(private mode: "build"|"client"|"server" , private originStack: any, state: RegistryState = {}){
    this.state = state
  }

  // must be idempotent for same file
  // must create different registrations for different files
  addService <TypeOfService extends object>(input: TypeOfService, callingFilename: string): ServiceReturnType<TypeOfService> {
    //create service name
    //todo: this is not good enough
    // we need to figure out if we're conflicting (ex 2 versions of AWS)
    // stack trace will be input into this
    const desiredServiceName = input.constructor.name;
    const node = this.toNode(desiredServiceName, input, callingFilename);
    this.state[desiredServiceName] = node;

    // map the node back to a callable object
    return Object.values(node.functions)
      .reduce((ret, nodeRecord) =>
        Object.assign(ret, {
          [nodeRecord.fnName]: nodeRecord.fn
        }), {}) as ServiceReturnType<TypeOfService>;
  }

  toNode(service: string, obj: object, callingFilename: string): RegistryNode {
    const functions = getAllFunctions(obj)
      .reduce((agg, prop) => {
        let fn;
        switch (this.mode) {
          case 'build':
            fn = () => Promise.reject(new Error("don't call service functions at build time"))
            break;
          case 'client':
            // fn = (...args: any) => fetch(`api/${service}/${prop}`, {
            //   // todo: gets? (would need some TS splitting)
            //   method: "POST",
            //   headers: [['Content-Type', 'application/json']],
            //   body: JSON.stringify(args)
            // });
            // break;
          case 'server':
            // todo: indirection
            fn = (...args: any) => (obj as any)[prop](...args);
            break;
        }
        return Object.assign(agg, {
          [prop]: {
            service: service,
            fnName: prop,
            fn: fn
          }
        });
      }, {});
      return {
        functions,
        filename: callingFilename
      }
  }

  resolve(service: string, fnName: string): AsyncFn {
    const resService = this.state[service];
    if (!resService) {
      throw new Error(`service ${resService} does not exist`);
    }
    const fn = resService.functions[fnName]
    if (!fn) {
      throw new Error(`function ${fnName} does not exist on service ${service}`);
    }
    //todo: composition
    return fn.fn;
  }

  getState(): RegistryState {
    // console.log(this.originStack);
    return this.state;
  }
}

// declare const window: any;
// declare const process: any;
// declare const thejuiceconst: TheJuice;

// function makeRegistry (): Registry {
//   //todo do better
//   if (typeof window === 'object') {
//     return new Registry('client', new Error().stack);
//   } else if (typeof process === 'object'
//     && process.env['RATHERNOT_BUILDING'] !== undefined) {
//     return new Registry('build', new Error().stack);
//   }
//   return new Registry('server', new Error().stack, (thejuicefile as TheJuice).registry);
// }
// const registryGlobal = makeRegistry();
// export default registryGlobal;
