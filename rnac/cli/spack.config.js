
  const { config } = require('@swc/core/spack');
  const { resolve } = require('path');


module.exports = config({
    entry: {
        'server': '/home/ec2-user/rn/rnac/cli/test/index.js',
    },
    output: {
        path: '/tmp/rn5dRqGL'
    },
    // target: "node",
    options: {
        jsc: {
            target: "es2018",
            keepClassNames: false,
            experimental: {
                plugins: [
                    [
                        resolve('.', 'service_injection.wasm'),
                        { "isClient": false }
                    ]
                ]
            }
        }
    }
});