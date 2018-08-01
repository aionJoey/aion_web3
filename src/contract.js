let {EventEmitter} = require('events')
let get = require('lodash/get')
let cloneDeep = require('lodash/cloneDeep')
let {isArray, each} = require('underscore')
let {copyString} = require('./lib/formats')
let abi = require('./abi')

let {
  inputLogFormatter,
  inputCallFormatter,
  inputDefaultBlockNumberFormatter,
  inputTransactionFormatter
} = require('./formatters')

let {assignExtend} = require('./extend')
let {assignProvider} = require('./providers')

let {hexToNumber} = require('./utils')

let {
  functionInterfaceValidator
  /*eventInterfaceValidator*/
} = require('./lib/contracts')

let methods = [
  {
    name: 'getPastLogs',
    call: 'eth_getLogs',
    params: 1,
    inputFormatter: [inputLogFormatter]
  },
  {
    name: 'getPastEvents',
    call: 'eth_getLogs',
    params: 1,
    inputFormatter: [inputLogFormatter]
  },
  {
    name: 'estimateGas',
    call: 'eth_estimateGas',
    params: 1,
    inputFormatter: [inputCallFormatter],
    outputFormatter: hexToNumber
  },
  {
    name: 'call',
    call: 'eth_call',
    params: 2,
    inputFormatter: [inputCallFormatter, inputDefaultBlockNumberFormatter],
    // add output formatter for decoding
    outputFormatter: function(result) {
      let {_outputs} = this
      return abi.decodeParameters(_outputs, result)
    }
  },
  {
    name: 'send',
    call: 'eth_sendTransaction',
    params: 1,
    inputFormatter: [inputTransactionFormatter]
  }
]

function ContractMethod({args, provider, contract, accounts}) {
  this._contract = contract
  this._accounts = accounts
  this._args = args
  this._outputs = contract.options.jsonInterface.outputs
  assignExtend(this, {methods})
  assignProvider(this, {provider})
}

ContractMethod.prototype.encodeABI = function(params) {
  return abi.encodeFunctionCall(this._contract.options.jsonInterface, params)
}

function Contract(jsonInterface, address, options) {
  let contract = this

  EventEmitter.call(contract)
  assignExtend(contract, {methods})

  let provider = get(contract, 'constructor.currentProvider')
  assignProvider(contract, {provider})

  let iface = cloneDeep(jsonInterface)
  let addr = copyString(address)
  let opts = cloneDeep(options)

  if (isArray(jsonInterface) === false) {
    iface = [iface]
  }

  each(iface, item => {
    let [valid, error] = functionInterfaceValidator(item)

    if (valid === false) {
      throw new Error(error)
    }
  })

  // magically get accounts
  let accounts =
    get(contract, 'constructor.accounts') ||
    get(contract, 'constructor._accounts')
  contract._accounts = accounts

  contract.jsonInterface = iface
  contract.address = addr
  contract.options = opts

  contract.options.address = addr
  contract.options.jsonInterface = iface

  /*

  allow users to automatically tack on their own methods

  */

  let handler = {
    get: function(obj, fnName) {
      if (fnName in obj) {
        return obj[fnName]
      }

      return function contractMethodCreator(...args) {
        let accounts = contract._accounts
        return new ContractMethod({args, provider, contract, accounts})
      }
    }
  }

  contract.methods = new Proxy(this, handler)
}

Contract.prototype = Object.create(EventEmitter.prototype)

Contract.prototype.clone = function() {
  let {options} = this
  let {jsonInterface, address} = options
  return new Contract(jsonInterface, address, options)
}

Contract.prototype.deploy = function(options, done) {}

module.exports = Contract
