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

function Web3(provider, providerOpts = {}) {
  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})

  this.eth = new Eth()
  this.eth.setProvider(this.currentProvider)

  this.net = new Net()
  this.net.setProvider(this.currentProvider)

  this.BatchRequest = BatchRequest
  this.utils = utils

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

Web3.prototype.version = '1.0.0'

Web3.prototype.modules = {
  Eth,
  Net,
  Personal,
  Bzz,
  Shh
}

Web3.prototype.providers = {
  HttpProvider,
  WebsocketProvider,
  IpcProvider
}

//
// Web3 static members
//

Web3.version = '1.0.0'
Web3.utils = utils

Web3.modules = {
  Eth,
  Net,
  Personal,
  Bzz,
  Shh
}

Web3.providers = {
  HttpProvider,
  WebsocketProvider,
  IpcProvider
}

if (typeof window !== 'undefined' && window.Web3 === undefined) {
  window.Web3 = Web3
}

module.exports = Web3
