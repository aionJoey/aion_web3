
# Aion, web3, and Webpack

It's possible to alias most ethereum web3 modules to use Aion modules. That could save you some time.

```sh
npm install aion-web3 webpack uglifyjs-webpack-plugin
touch webpack.config.js
# paste in below
```

Here's an example `webpack.config.js` with a specific `resolve` section. It aliases web3 packages to aion modules.

```js
/*

# webpack config

https://webpack.js.org
https://webpack.js.org/configuration

*/

let path = require('path')
let webpack = require('webpack')
let UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin')
let env = process.env.NODE_ENV
let dev = env === 'development'
let prd = env === 'production'

let entryPath = path.join(__dirname, 'src', 'index.js')
let outputPath = path.join(__dirname, 'dist')

if (env !== 'development') {
  env = 'production'
  prd = true
}

let opts = {
  target: 'web',
  mode: env,
  entry: entryPath,
  output: {
    path: outputPath,
    filename: 'index.js'
  },
  watch: false,
  cache: dev,
  //
  // here's where the magic happens
  //
  resolve: {
    'web3': 'aion-web3',
    'web3-eth': 'aion-web3/eth',
    'web3-eth-abi': 'aion-web3/abi',
    'web3-eth-accounts': 'aion-web3/accounts',
    'web3-eth-contract': 'aion-web3/contract',
    'web3-eth-iban': 'aion-web3/iban',
    'web3-eth-personal': 'aion-web3/personal',
    'web3-net': 'aion-web3/net',
    'web3-providers-http': 'aion-web3/http-provider',
    'web3-providers-ipc': 'aion-web3/ipc-provider',
    'web3-providers-ws': 'aion-web3/websocket-provider',
    'web3-utils': 'aion-web3/utils'
  },
  performance: {
    hints: false
  },
  stats: {
    assets: false,
    colors: dev,
    errors: true,
    errorDetails: true,
    hash: false
  }
}

if (dev === true) {
  opts.devtool = 'source-map'
}

if (prd === true) {
  opts.optimization = {
    minimize: true,
    minimizer: [
      new UglifyjsWebpackPlugin({
        sourceMap: false,
        uglifyOptions: {
          ecma: 5,
          mangle: true,
          compress: true,
          warnings: false
        }
      })
    ]
  }
}

module.exports = opts
````
