let {EventEmitter} = require('events')
let {noop, each, isString} = require('underscore')

let {assignProvider} = require('./providers')
let {assignExtend} = require('./extend')

let BatchRequest = require('./batch-request')
let Contract = require('./contract')
let Iban = require('./iban')
let Accounts = require('./accounts')
let Net = require('./net')
let Personal = require('./personal')

let {hexToNumber, toChecksumAddress, numberToHex, isHex} = require('./utils')

let {
  outputBigNumberFormatter,
  outputSyncingFormatter,
  inputAddressFormatter,
  inputDefaultBlockNumberFormatter,
  inputBlockNumberFormatter,
  outputBlockFormatter,
  outputTransactionFormatter,
  outputTransactionReceiptFormatter,
  inputTransactionFormatter,
  inputSignFormatter,
  inputCallFormatter,
  inputLogFormatter,
  outputLogFormatter
} = require('./formatters')

let hexSplit = (val, one, two) =>
  isString(val) === true && isHex(val) === true ? one : two

let blockCall = ([val]) =>
  hexSplit(val, 'eth_getBlockByHash', 'eth_getBlockByNumber')

let uncleCall = ([val]) =>
  hexSplit(
    val,
    'eth_getUncleByBlockHashAndIndex',
    'eth_getUncleByBlockNumberAndIndex'
  )

let getBlockTransactionCountCall = ([val]) =>
  hexSplit(
    val,
    'eth_getBlockTransactionCountByHash',
    'eth_getBlockTransactionCountByNumber'
  )

let uncleCountCall = ([val]) =>
  hexSplit(
    val,
    'eth_getUncleCountByBlockHash',
    'eth_getUncleCountByBlockNumber'
  )

let transactionFromBlockCall = ([val]) =>
  hexSplit(
    val,
    'eth_getTransactionByBlockHashAndIndex',
    'eth_getTransactionByBlockNumberAndIndex'
  )

let methods = [
  {
    name: 'getNodeInfo',
    call: 'web3_clientVersion'
  },
  {
    name: 'getProtocolVersion',
    call: 'eth_protocolVersion',
    params: 0
  },
  {
    name: 'getCoinbase',
    call: 'eth_coinbase',
    params: 0
  },
  {
    name: 'isMining',
    call: 'eth_mining',
    params: 0
  },
  {
    name: 'getHashrate',
    call: 'eth_hashrate',
    params: 0,
    // outputFormatter: hexToNumber
    // originally it used the above but the RPC can return a real number
    outputFormatter: val => parseInt(val, 10)
  },
  {
    name: 'isSyncing',
    call: 'eth_syncing',
    params: 0,
    outputFormatter: outputSyncingFormatter
  },
  {
    name: 'getGasPrice',
    call: 'eth_gasPrice',
    params: 0,
    outputFormatter: outputBigNumberFormatter
  },
  {
    name: 'getAccounts',
    call: 'eth_accounts',
    params: 0,
    outputFormatter: val =>
      val.length === 0 ? val : val.map(toChecksumAddress)
  },
  {
    name: 'getBlockNumber',
    call: 'eth_blockNumber',
    params: 0,
    outputFormatter: hexToNumber
  },
  {
    name: 'getBalance',
    call: 'eth_getBalance',
    params: 2,
    inputFormatter: [inputAddressFormatter, inputDefaultBlockNumberFormatter],
    outputFormatter: outputBigNumberFormatter
  },
  {
    name: 'getStorageAt',
    call: 'eth_getStorageAt',
    params: 3,
    inputFormatter: [
      inputAddressFormatter,
      numberToHex,
      inputDefaultBlockNumberFormatter
    ]
  },
  {
    name: 'getCode',
    call: 'eth_getCode',
    params: 2,
    inputFormatter: [inputAddressFormatter, inputDefaultBlockNumberFormatter]
  },
  {
    name: 'getBlock',
    call: blockCall,
    params: 2,
    inputFormatter: [
      inputBlockNumberFormatter,
      function(val) {
        return !!val
      }
    ],
    outputFormatter: outputBlockFormatter
  },
  {
    name: 'getUncle',
    call: uncleCall,
    params: 2,
    inputFormatter: [inputBlockNumberFormatter, numberToHex],
    outputFormatter: outputBlockFormatter
  },
  {
    name: 'getBlockTransactionCount',
    call: getBlockTransactionCountCall,
    params: 1,
    inputFormatter: [inputBlockNumberFormatter],
    outputFormatter: hexToNumber
  },
  {
    name: 'getBlockUncleCount',
    call: uncleCountCall,
    params: 1,
    inputFormatter: [inputBlockNumberFormatter],
    outputFormatter: hexToNumber
  },
  {
    name: 'getTransaction',
    call: 'eth_getTransactionByHash',
    params: 1,
    inputFormatter: [null],
    outputFormatter: outputTransactionFormatter
  },
  {
    name: 'getTransactionFromBlock',
    call: transactionFromBlockCall,
    params: 2,
    inputFormatter: [inputBlockNumberFormatter, numberToHex],
    outputFormatter: outputTransactionFormatter
  },
  {
    name: 'getTransactionReceipt',
    call: 'eth_getTransactionReceipt',
    params: 1,
    inputFormatter: [null],
    outputFormatter: outputTransactionReceiptFormatter
  },
  {
    name: 'getTransactionCount',
    call: 'eth_getTransactionCount',
    params: 2,
    inputFormatter: [inputAddressFormatter, inputDefaultBlockNumberFormatter],
    outputFormatter: hexToNumber
  },
  {
    name: 'sendSignedTransaction',
    call: 'eth_sendRawTransaction',
    params: 1
  },
  {
    name: 'signTransaction',
    call: 'eth_signTransaction',
    params: 1,
    inputFormatter: [inputTransactionFormatter]
  },
  {
    name: 'sendTransaction',
    call: 'eth_sendTransaction',
    params: 1,
    inputFormatter: [inputTransactionFormatter]
  },
  {
    name: 'sign',
    call: 'eth_sign',
    params: 2,
    inputFormatter: [inputSignFormatter, inputAddressFormatter],
    transformPayload: function(payload) {
      payload.params.reverse()
      return payload
    }
  },
  {
    name: 'call',
    call: 'eth_call',
    params: 2,
    inputFormatter: [inputCallFormatter, inputDefaultBlockNumberFormatter]
  },
  {
    name: 'estimateGas',
    call: 'eth_estimateGas',
    params: 1,
    inputFormatter: [inputCallFormatter],
    outputFormatter: hexToNumber
  },
  {
    name: 'getCompilers',
    call: 'eth_getCompilers',
    params: 0
  },
  {
    name: 'compile.solidity',
    call: 'eth_compileSolidity',
    params: 1
  },
  {
    name: 'compile.lll',
    call: 'eth_compileLLL',
    params: 1
  },
  {
    name: 'compile.serpent',
    call: 'eth_compileSerpent',
    params: 1
  },
  {
    name: 'submitWork',
    call: 'eth_submitWork',
    params: 3
  },
  {
    name: 'getWork',
    call: 'eth_getWork',
    params: 0
  },
  {
    name: 'getPastLogs',
    call: 'eth_getLogs',
    params: 1,
    inputFormatter: [inputLogFormatter],
    outputFormatter: outputLogFormatter
  }
]

function Eth(provider, providerOpts) {
  this._subscriptions = []

  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})

  this.defaultAccount = null
  this.defaultBlock = 'latest'
  this.net = new Net()
  this.personal = new Personal()
  this.personal.setProvider(this.currentProvider)

  this.accounts = new Accounts()
}

Eth.prototype.Iban = Iban
Eth.prototype.Contract = Contract
Eth.prototype.BatchRequest = BatchRequest

/**
 * Subscribe to server events
 *
 * Subscribe to these events:
 * + pendingTransactions
 * + newBlockHeaders
 * + syncing
 * + logs, options {fromBlock, address, topics}
 *
 * Emitter events:
 * + data, object
 * + change, object
 * + error, Error
 *
 * @param {string} evtName event name
 * @param {object} [opts]
 * @param {number} opts.fromBlock
 * @param {string|array} opts.address
 * @param {array} opts.topics
 * @param {function} done
 * @return {object}
 */
Eth.prototype.subscribe = function(evtName, opts, done) {
  let sub = new EventEmitter()
  sub.id = Math.random()
    .toString()
    .substring(2)
  sub.evtName = evtName
  sub.options = opts

  if (opts === undefined && done === undefined) {
    opts = {}
    done = noop
  }

  if (typeof opts === 'function') {
    done = opts
    opts = {}
  }

  sub.subscribe = done => {
    done()
  }

  sub.unsubscribe = done => {
    done()
  }

  sub.arguments = arguments

  this._subscriptions.push(sub)

  return sub
}

/**
 * Unsubscribe on this instance of Eth
 * @param {boolean} keepSyncing clear all except syncing
 * @return {boolean}
 */
Eth.prototype.clearSubscriptions = function(keepSyncing = false) {
  each(this._subscriptions, item => {
    if (keepSyncing === true && item.evtName === 'syncing') {
      return
    }
    item.unsubscribe()
  })
  return true
}

module.exports = Eth
