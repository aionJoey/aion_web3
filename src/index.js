/**
 * Aion Web3
 * @module Web3
 */

// helpers
let {assignExtend} = require('./extend.js')
let {assignProvider} = require('./providers.js')
let utils = require('./utils.js')

// constructors
let BatchRequest = require('./batch-request.js')
let Bzz = require('./bzz.js')
let Eth = require('./eth.js')
let HttpProvider = require('./http-provider')
let WebsocketProvider = require('./websocket-provider')
let IpcProvider = require('./ipc-provider')
let Net = require('./net.js')
let Personal = require('./personal.js')
let Shh = require('./shh.js')

let methods = []

/**
 * Aion Web3 constructor
 * @constructor Web3
 * @param {object|string} provider
 * @param {object} [providerOpts]
 */
function Web3(provider, providerOpts = {}) {
  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})

  this.eth = new Eth()
  this.eth.setProvider(this.currentProvider)

  this.net = new Net()
  this.net.setProvider(this.currentProvider)

  this.BatchRequest = BatchRequest
  this.utils = utils

  this.personal = new Personal(this.currentProvider)

  Object.defineProperty(this, 'bzz', {
    get: function() {
      throw new Error(`aion doesn't implement bzz`)
    }
  })

  Object.defineProperty(this, 'shh', {
    get: function() {
      throw new Error(`aion doesn't implement bzz`)
    }
  })
}

//
// Web3 instance memembers
//

/**
 * Access version from client. It helps the ecosystem detect compatibility.
 * @instance
 * @property {string} version
 */
Web3.prototype.version = '1.0.0'

/**
 * Access submodules of Web3
 * @instance
 * @property {object} modules
 */
Web3.prototype.modules = {
  Eth,
  Net,
  Personal,
  Bzz,
  Shh
}

/**
 * Access providers from Web3
 *
 * `new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))`
 *
 * @instance
 * @property {object} providers
 */
Web3.prototype.providers = {
  HttpProvider,
  WebsocketProvider,
  IpcProvider
}

//
// Web3 static members
//

/**
 * Also access version from the static property
 * @static
 * @property {string} version
 */
Web3.version = '1.0.0'

/**
 * Web3 utils are useful functions for working with hex, hashing, and
 * formatting.
 * @static
 * @property {object} utils
 */
Web3.utils = utils

/**
 * Access Web3 submodules from a static member
 * @static
 * @property {object} modules
 */
Web3.modules = {
  Eth,
  Net,
  Personal,
  Bzz,
  Shh
}

/**
 * Providers accessed from static property
 * @static
 * @property {object} providers
 */
Web3.providers = {
  HttpProvider,
  WebsocketProvider,
  IpcProvider
}

if (typeof window !== 'undefined' && window.Web3 === undefined) {
  window.Web3 = Web3
}

module.exports = Web3
