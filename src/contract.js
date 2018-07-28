let {EventEmitter} = require('events')
let {isObject} = require('underscore')

let {
  inputLogFormatter,
  inputCallFormatter,
  inputDefaultBlockNumberFormatter,
  inputTransactionFormatter
} = require('./formatters')

let {assignExtend} = require('./extend')
let {hexToNumber} = require('./utils')
// let {jsonInterfaceValidator} = require('./lib/contracts')

let methods = [
  {
    name: 'getPastLogs',
    call: 'eth_getLogs',
    params: 1,
    inputFormatter: [inputLogFormatter]
    // outputFormatter: this._decodeEventABI.bind(subOptions.event)
  },
  {
    name: 'estimateGas',
    call: 'eth_estimateGas',
    params: 1,
    inputFormatter: [inputCallFormatter],
    outputFormatter: hexToNumber
    // requestManager: _this._parent._requestManager,
    // accounts: ethAccounts // is eth.accounts (necessary for wallet signing)
    // defaultAccount: _this._parent.defaultAccount,
    // defaultBlock: _this._parent.defaultBlock
  },
  {
    name: 'call',
    call: 'eth_call',
    params: 2,
    inputFormatter: [inputCallFormatter, inputDefaultBlockNumberFormatter]
    // add output formatter for decoding
    /*outputFormatter: function(result) {
      return _this._parent._decodeMethodReturn(_this._method.outputs, result)
    },*/
    // requestManager: _this._parent._requestManager,
    // accounts: ethAccounts, // is eth.accounts (necessary for wallet signing)
    // defaultAccount: _this._parent.defaultAccount,
    // defaultBlock: _this._parent.defaultBlock
  },
  {
    name: 'sendTransaction',
    call: 'eth_sendTransaction',
    params: 1,
    inputFormatter: [inputTransactionFormatter]
    // requestManager: _this._parent._requestManager,
    // accounts: _this.constructor._ethAccounts || _this._ethAccounts, // is eth.accounts (necessary for wallet signing)
    // defaultAccount: _this._parent.defaultAccount,
    // defaultBlock: _this._parent.defaultBlock,
    // extraFormatters: extraFormatters
  }
]

function Contract(jsonInterface, address, options) {
  EventEmitter.call(this)
  assignExtend(this, {methods})

  /*let [valid, errors] = jsonInterfaceValidator(jsonInterface)

  console.log('valid', valid)
  console.log('errors', errors)*/

  if (isObject(address) === true) {
    this.options = address
  }

  this.address = address || null
  this.options = options || {}

  /*

  allow users to automatically tack on their own methods

  */

  /*let handler = {
    get(target, name) {
      function contractMethod(args) {}
    }
  }

  this.methods = new Proxy(this, handler)*/
}

Contract.prototype = Object.create(EventEmitter.prototype)

module.exports = Contract
