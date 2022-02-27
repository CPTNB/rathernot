/*
Why not use something like jest?

┌─[ec2-user@dacloud] - [~/rn/cli] - [672]
└─[$] npm install --save-dev jest                                    [21:50:00]

added 331 packages, and audited 334 packages in 8s

28 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
┌─[ec2-user@dacloud] - [~/rn/cli] - [673]
└─[$] du -sh node_modules                                            [21:53:25]
103M  node_modules
*/

export type Test = {
  run: () => Promise<any>,
  name: string
}

export function it (name: string, fn: () => Promise<any>): Test {
  return {
    run: fn,
    name: name
  }
}

type Domain = {
  name: string,
  tests: Test[]
}

const domains: Domain[] = []

export function describe(domain: string, tests: Test[]) {
  domains.push({
    name: domain,
    tests: tests
  });
}

// const results: [Test, Error?][] = []

//   var test;
//   for (var i = 0; i < tests.length ; i++) {
//     test = tests[i];
//     try {
//       const result = await test.run();
//       results.push(test, undefined);
//     } catch (error) {
//       results.push(test, error)
//     }
//   }
