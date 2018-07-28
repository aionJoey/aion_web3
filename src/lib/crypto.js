/*

all these functions should work with a byte array while in other places
there is a lot of monkey-business about 0x, strings, hex, and etc.

*/

let {Buffer} = require('safe-buffer')
let blake2b = require('blake2b')
let jsSha3 = require('js-sha3')
let nacl = require('tweetnacl')
let node =
  typeof global === 'undefined'
    ? require('crypto-browserify')
    : require('crypto')
let scrypt = require('scryptsy')

function keccak256(val) {
  return Buffer.from(jsSha3.keccak256(val), 'hex')
}

function blake2b128(val) {
  // 16
  let out = Buffer.alloc(blake2b.BYTES_MIN)
  return blake2b(blake2b.BYTES_MIN)
    .update(val)
    .digest(out)
}

function blake2b256(val) {
  // 32
  let out = Buffer.alloc(blake2b.BYTES)
  blake2b(blake2b.BYTES)
    .update(val)
    .digest(out)
  return out
}

module.exports = {
  keccak256,
  blake2b128,
  blake2b256,
  nacl,
  node,
  scrypt
}
