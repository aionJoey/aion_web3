# aion_web3

A JavaScript library for interacting with the Aion network.

**If you're porting your Ethereum app to Aion this API is nearly identical. Minimal modifications are necessary if any.**

+ [Guide: Porting Ethereum web3-based app to Aion](./docs/guides/porting.md)
+ [Alias web3 modules to aion-web3 modules in Webpack](./docs/guides/webpack.md)

## Install

```sh
npm install aion-web3
```

## Connect to Aion

Simple examples of RPC calls

```js
let Web3 = require('aion-web3')
let web3 = new Web3('https://conquest-web3.aion.network:443')

// check current gas price
web3.eth
  .getGasPrice()
  .then(res => {
    console.log('conquest gas price', res)
  })
  .catch(err => {
    console.error('error getting gas price', err)
  })

// get your balance
web3.eth
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

A new capability of Web3 is that it can create and submit binary transactions directly without reliance on the Personal interfaces.

```js
let privateKey = Buffer.from('.. my private key hex', 'hex')
let account = web3.eth.accounts.privateKeyToAccount(privateKey)

let tx = {
  to: '0xa0b1b3f651990669c031866ec68a4debfece1d3ffb9015b2876eda2a9716160b',
  value: 1000000,
  gas: 20000
}

/*

All these RPC calls are available from a Promise interface too

*/

account.signTransaction(tx, (err, signedTx) => {
  if (err !== null && err !== undefined) {
    return console.error('error signing transaction', err)
  }

  let {messageHash, signature, rawTransaction} = signedTx

  console.log('messageHash', messageHash)
  console.log('signature', signature)
  console.log('rawTransaction', rawTransaction)

  web3.eth.sendSignedTransaction(rawTransaction, (err, txHash) => {
    if (err !== null && err !== undefined) {
      return console.error('error sending signed transaction', err)
    }

    // the node received the transaction ✅

    console.log('txHash', txHash)
    /*

    txHash === messageHash

    From here you may want to check receipts, confirmations, and other operations.

    */
  })
})
````

In the browser you have some choices.

+ Using your bundler `let Web3 = require('aion-web3')`
  * See also the [Webpack guide](./docs/guides/webpack.md)
+ Put `./dist/aion-web3.min.js` into your `<script src="./dist/aion-web3.min.js"></script>`
  * `window.Web3`

## Documentation

Please refer to [Ethereum web3 v1.0 documentation](https://web3js.readthedocs.io/en/1.0/index.html) as the API is as exact as it can be.

**WIP** [Aion Web3 documentation](./docs/gen)

[A bit of history](https://github.com/aionnetwork/aion_web3/issues/10) how this module came into being.

## Development

```sh
git clone https://github.com/aionnetwork/aion_web3.git
cd aion_web3
npm install

# watch for changes and test
npm run dev

# unit tests
npm test

# integration tests (requires running node)
npm run integration

# coverage
npm run coverage

# build for production
npm run prd
```

The tools will give you instant feedback about code style and unit testing. Contributors are encouraged to maintain good code coverage and try not to check in style errors.

## Resources

+ https://aion.network
+ Aion wiki https://github.com/aionnetwork/aion/wiki
+ Aion forum https://forum.aion.network
+ [Aion Web3 Guides](./docs/guides)
+ [eslint](https://eslint.org/) - our linter
+ [prettier](https://prettier.io/) - automatic js formatting

