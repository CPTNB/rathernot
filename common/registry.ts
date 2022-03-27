import {
  ServiceReturnType,
  TheJuice
} from './application'
//@ts-ignore
import { thejuicefile } from './thejuice'

type AsyncFn = (...args: any) => Promise<any>

type RegistryNode = {
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

class Registry {
  private state: RegistryState;
  constructor(private mode: "build"|"client"|"server" , state: RegistryState = {}){
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
    const functions =  Object.entries(obj)
      .filter(([key, value]) => typeof value === 'function')
      .reduce((agg, [key, value]) => {
        let fn;
        switch (this.mode) {
          case 'build':
            fn = () => Promise.reject(new Error("don't call service functions at build time"))
            break;
          case 'client':
            fn = (...args: any) => fetch(`api/${service}/${key}`, {
              // todo: gets? (would need some TS splitting)
              method: "POST",
              headers: [['Content-Type', 'application/json']],
              body: JSON.stringify(args)
            });
            break;
          case 'server':
            // todo: indirection
            fn = (...args: any) => (obj as any)[key](...args);
            break;
        }
        return Object.assign(agg, {
          [key]: {
            service: service,
            fnName: key,
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
    return this.state;
  }
}

declare const window: any;
declare const process: any;
declare const thejuiceconst: TheJuice;

function makeRegistry (): Registry {
  //todo do better
  if (typeof window === 'object') {
    // the juice is there in the air (global)
    return new Registry('client', thejuiceconst.registry);
  } else if (typeof process === 'object'
    && process.env['RATHERNOT_BUILDING'] !== undefined) {
    return new Registry('build');
  }
  return new Registry('server', (thejuicefile as TheJuice).registry);
}
const registryGlobal = makeRegistry();
export default registryGlobal;
