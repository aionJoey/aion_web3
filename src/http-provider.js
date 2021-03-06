/**
 * @module HttpProvider
 */

let fetch = require('cross-fetch')
let values = require('./lib/values')

let method = 'POST'

let headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

/**
 * HttpProvider constructor
 * @method HttpProvider
 * @param {string} url
 * @param {object} opts
 */
function HttpProvider(url = values.rpc.url, opts = {}) {
  this.url = url
  this.opts = opts
}

/**
 * Send the payload to the node RPC
 * @method send
 * @param {object} payload
 * @param {function} done
 */
HttpProvider.prototype.send = function(payload, done) {
  let body = JSON.stringify(payload)
  let url = this.url
  let fetchOpts = Object.assign({}, this.opts, {
    method,
    headers,
    body
  })

  fetch(url, fetchOpts)
    .then(res => res.json())
    .then(({error, result}) => done(error, result))
    .catch(done)
}

module.exports = HttpProvider
