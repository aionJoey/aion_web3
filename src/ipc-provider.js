// let net = require('net')

function IpcProvider(url, net) {
  this.url = url
  this.net = net
}

IpcProvider.prototype.send = function(/*payload, done*/) {
  // net send payload
}

module.exports = IpcProvider
