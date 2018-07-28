# aion_web3

A JavaScript library for interacting with the Aion network.

**If you're porting your Ethereum app to Aion this API is nearly identical. Minimal modifications are necessary if any.**

+ [Guide: Porting Ethereum web3-based app to Aion](./docs/guides/porting.md)
+ [Alias web3 modules to aion-web3 modules in Webpack](./docs/webpack.md)

## Install

```sh
npm install aion-web3
```

## Connect to Aion

```js
let Web3 = require('aion-web3')
let aion = new Web3('https://conquest-web3.aion.network:443')

// get protocol version
aion.eth
  .getProtocolVersion()
  .then(res => {
    console.log('conquest protocol version', res)
  })
  .catch(err => {
    console.error('error getting protocol version', err)
  })

// check current gas price
aion.eth
  .getGasPrice()
  .then(res => {
    console.log('conquest gas price', res)
  })
  .catch(err => {
    console.error('error getting gas price', err)
  })

// get your balance
aion.eth
  .getBalance(
    '0xa0b1b3f651990669c031866ec68a4debfece1d3ffb9015b2876eda2a9716160b'
  )
  .then(res => {
    console.log('conquest balance', res)
  })
  .catch(err => {
    console.error('error getting balance', err)
  })
```

In the browser you have some choices.

+ Using your bundler `let Web3 = require('aion-web3')`
  * See also [./docs/guides/webpack.md](./docs/guides/webpack.md)
+ Put `./dist/aion-web3.min.js` into your `<script src="./dist/aion-web3.min.js"></script>`
  * `window.Web3`

## Documentation

Please refer to [Ethereum web3 v1.0 documentation](https://web3js.readthedocs.io/en/1.0/index.html) until our Aion-specific docs are generated soon.

[A bit of history](https://github.com/aionnetwork/aion_web3/issues/10)  how this module came into being.

## Development

```sh
git clone https://github.com/aionnetwork/aion_web3.git
cd aion_web3
npm install

# watch for changes and test
npm run dev

# just test
npm test

# build for production
npm run prd
```
