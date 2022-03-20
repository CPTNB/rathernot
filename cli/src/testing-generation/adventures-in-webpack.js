const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require("copy-webpack-plugin");

const ts = {
  test: /\.tsx?$/,
  use: [
    { loader: 'ts-loader', options: {  } }
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

module.exports.getPackin = function getPackin(UI, outDir) {
  const client = {
    entry: './client/App.tsx',
    module: { rules: [ts] },
    ...resolveTs,
    ...dev,
    externals: {
      react: 'React',
      "react-dom": 'ReactDOM'
    },
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
            options: UI
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
    plugins: [new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "Dockerfile") },
      ],
    })],
    output: {
      filename: 'server.js',
      path: path.resolve(outDir)
    },
  }
  return [client, server]
}

module.exports.packUserSpace = function packUserSpace (absolutePathToUserSpace, outDir) {
  return {
    entry: absolutePathToUserSpace,
    module: {
      rules: [
        ts
      ]
    },
    ...resolveTs,
    ...dev,
    target: 'node',
    externals: [
      {
        ...nodeExternals(),
        react: 'React',
        "react-dom": 'ReactDOM'
      }
    ],
    externalsPresets: {
        node: true
    },
    output: {
      filename: 'userspace.js',
      path: path.resolve(outDir),
      libraryTarget: 'commonjs',
      chunkFormat: 'commonjs'
    },
  }
}
