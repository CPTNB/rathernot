const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require("copy-webpack-plugin");
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');

const ts = {
  test: /\.tsx?$/,
  use: [
    { loader: 'ts-loader', options: { transpileOnly: true }}
  ],
  exclude: /node_modules/,
}
const resolveTs = {
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
}
const dev = {
  mode: "development"
}

module.exports.getPackin = function getPackin(registry, outDir) {
  const client = {
    entry: './client/App.tsx',// needs to be an entry shim
    module: { rules: [ts] },//not ts
    ...resolveTs,//not ts
    ...dev,
    externals: {
      react: 'React', //comes from resource
      "react-dom": 'ReactDOM' //comes from resource
    },
    plugins: [
    ],
    output: {
      filename: 'client.js',
      path: path.resolve(outDir, 'client')
    }
  }
  const server = {
    entry: './server/server.ts',
    module: {
      rules: [
        {
          test: /thejuice.*/,
          use: {
            loader: 'val-loader',
            options: registry.getState()
          }
        },
        ts
      ]
    },
    ...resolveTs,
    ...dev,
    target: 'node',
    externals: [nodeExternals()],
    externalsPresets: {
        node: true
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.resolve(__dirname, "Dockerfile") },
        ],
      }),
      new ForkTsCheckerWebpackPlugin({
        async: false,
      }),
      // new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false })
    ],
    output: {
      filename: 'server.js',
      path: path.resolve(outDir)
    },
  }
  return [client, server]
}

// module.exports.packUserSpace = function packUserSpace (absolutePathToUserSpace, outDir) {
//   return {
//     entry: absolutePathToUserSpace,
//     module: {
//       rules: [
//         ts
//       ]
//     },
//     ...resolveTs,
//     ...dev,
//     target: 'node',
//     externals: [
//       {
//         ...nodeExternals(),
//         react: 'React',
//         "react-dom": 'ReactDOM'
//       }
//     ],
//     externalsPresets: {
//         node: true
//     },
//     plugins: [
//       new ForkTsCheckerWebpackPlugin({
//         async: false,
//       }),
//       // new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false })
//     ],
//     output: {
//       filename: 'userspace.js',
//       path: path.resolve(outDir),
//       libraryTarget: 'commonjs',
//       chunkFormat: 'commonjs'
//     },
//   }
// }
