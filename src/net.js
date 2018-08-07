/**
 * @module Net
 */

let {hexToNumber} = require('./utils')
let {assignProvider} = require('./providers')
let {assignExtend} = require('./extend')

let methods = [
  {
    name: 'getId',
    call: 'net_version',
    params: 0,
    outputFormatter: hexToNumber
  },
  {
    name: 'isListening',
    call: 'net_listening',
    params: 0
  },
  {
    name: 'getPeerCount',
    call: 'net_peerCount',
    params: 0,
    outputFormatter: hexToNumber
  }
]

/**
 * Net constructor
 * @method Net
 * @param {object} provider
 * @param {object} providerOpts
 */
function Net(provider, providerOpts) {
  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})
}

module.exports = Net
