/**
 * @module Contract
 */

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
    name: 'estimate',
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
  this._evts = {}
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

ContractMethod.prototype.on = function(evt, fn) {
  this._evts[evt] = fn
  return this
}

/**
 * An object that facilitates working with smart contracts
 * @constructor Contract
 * @param {object} jsonInterface
 * @param {string} address
 * @param {object} options
 */
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

  // passed from Eth.prototype.Contract
  contract._accounts = null

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

/**
 * Copy the Contract object
 * @instance
 * @method clone
 * @returns {object}
 */
Contract.prototype.clone = function() {
  let {options} = this
  let {jsonInterface, address} = options
  return new Contract(jsonInterface, address, options)
}

/**
 * Deploy the contract
 * @method deploy
 * @param {object} options
 * @param {string} options.data smart contract bytes in hex
 * @param {array} options.arguments smart contract contructor arguments
 * @returns {object}
 */
Contract.prototype.deploy = function(options) {
  let {data} = options

  if (data === undefined || data === null) {
    throw new Error('the contract data cannot be blank')
  }

  if (options.arguments !== undefined && isArray(options.arguments) === false) {
    throw new Error('the optional constructor arguments must be an array')
  }

  this.options = Object.assign(this.options, options)

  /*let {jsonInterface} = this.options
  let resolve
  let reject

  let contractConstructor = find(jsonInterface, item => {
    return item.name === 'constructor'
  })

  let originalSend = contract.send
  let originalSend = contract.send

  contract.send = function(...args) {
    originalSend(...args)
    return contract
  }

  contract.send.request = function() {}

  contract.encodeABI = function() {}

  contract.estimateGas = function() {}

  //
  // emulate a promise
  //

  contract.then = (r1, r2) => {
    resolve = r1
    if (isFunction(r2) === true) {
      reject = t2
    }
  }

  contract.catch = r => {
    reject = r
  }
*/
  return this
}

module.exports = Contract
