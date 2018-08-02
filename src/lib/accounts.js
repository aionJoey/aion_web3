let {isString, isArray} = require('underscore')
let patterns = require('./patterns')
let values = require('./values')
let {blake2b256, keccak256} = require('./crypto')

let {
  prependZeroX,
  removeLeadingZeroX,
  hexToBuffer,
  randomHexBuffer,
  Buffer,
  toBuffer
} = require('./formats')

function createPrivateKey(entropy) {
  if (entropy === undefined) {
    entropy = randomHexBuffer()
  }
  let pk = keccak256(Buffer.concat([randomHexBuffer(), entropy]))
  pk = hexToBuffer(pk)
  pk = keccak256(Buffer.concat([randomHexBuffer(), pk]))
  pk = hexToBuffer(pk)
  return pk
}

let isPrivateKey = val =>
  (isArray(val) === true || Buffer.isBuffer(val) === true) && val.length > 0

function createA0Address(publicKey) {
  let pkHash = Buffer.from(blake2b256(publicKey))
  return Buffer.concat([values.addresses.identifier, pkHash], 32)
}

let createA0AddressString = val => prependZeroX(val.toString('hex'))

function isAccountAddress(val) {
  if (val === undefined || isString(val) === false) {
    return false
  }

  return patterns.address.test(val) === true
}

function createChecksumAddress(val) {
  let address = removeLeadingZeroX(val)
  let addressHash = keccak256(toBuffer(address.toLowerCase())).toString('hex')

  return prependZeroX(
    addressHash
      .split('')
      .map(item => parseInt(item, 16))
      .map((item, index) => {
        let char = address[index]
        if (isNaN(char) === false) {
          // numeric
          return char
        }
        return item > 7 ? char.toUpperCase() : char.toLowerCase()
      })
      .join('')
  )
}

let isValidChecksumAddress = val => val === createChecksumAddress(val)

function equalAddresses(addr1, addr2) {
  return (
    removeLeadingZeroX(addr1.toLowerCase()) ===
    removeLeadingZeroX(addr2.toLowerCase())
  )
}

module.exports = {
  createPrivateKey,
  isPrivateKey,
  createA0Address,
  createA0AddressString,
  isAccountAddress,
  createChecksumAddress,
  isValidChecksumAddress,
  equalAddresses
}
