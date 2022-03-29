import { Registry, RegistryNode } from '../../../common/registry';

// warning: Service stuff can't be a default export
// (yikes)

function getFetcher(service: string, fn: string) {
  return `(...args) => fetch('api/${service}/${fn}', {
      method: "POST",
      headers: [['Content-Type', 'application/json']],
      body: JSON.stringify(args)
    })`
}

function getServiceStubCode (nodes: RegistryNode[]) {
  return nodes
    .map(node => Object.values(node.functions))
    .filter(fnArray => fnArray.length > 0)
    .map(fnArray => `
module.exports = {
  ${fnArray.map(fn => `${fn.fnName}: ${getFetcher(fn.service, fn.fnName)}`).join(',\n')}
};
`).join('\n');
}

export function codeGen (registry: Registry): { [key: string]: string } {
  const state = registry.getState();
  const nodes = Object.values(state)
    .reduce((nodes, nextNode) => Object.assign(nodes, {
      [nextNode.filename]: (nodes[nextNode.filename] || []).concat(nextNode)
    }), {} as { [key: string]: RegistryNode[] });

  // [filename, codeString][]
  return Object.entries(nodes)
    .map(([filename, nodes]) => [filename, getServiceStubCode(nodes)])
    .reduce((codeLookup, [filename, code]) => Object.assign(codeLookup, {
      [filename]: code
    }), {});
}
