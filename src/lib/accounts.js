let {isString, isArray} = require('underscore')
let patterns = require('./patterns')
let values = require('./values')
let {blake2b256, keccak256, nacl} = require('./crypto')

let {
  prependZeroX,
  removeLeadingZeroX,
  randomHexBuffer,
  Buffer,
  toBuffer
} = require('./formats')

function createKeyPair({entropy, privateKey}) {
  let kp
  let keyPair

  if (privateKey !== undefined) {
    kp = nacl.sign.keyPair.fromSecretKey(toBuffer(privateKey))
    keyPair = {
      privateKey: toBuffer(kp.secretKey),
      publicKey: toBuffer(kp.publicKey)
    }
    return keyPair
  }

  if (entropy === undefined) {
    entropy = randomHexBuffer()
  }

  kp = nacl.sign.keyPair.fromSeed(entropy.slice(0, nacl.sign.seedLength))
  keyPair = {
    privateKey: toBuffer(kp.secretKey),
    publicKey: toBuffer(kp.publicKey)
  }
  return keyPair
}

let isPrivateKey = val =>
  (isArray(val) === true || Buffer.isBuffer(val) === true) && val.length > 0

function createA0Address(publicKey) {
  let pkHash = Buffer.from(blake2b256(publicKey)).slice(1, 32)
  let address = Buffer.concat([values.addresses.identifier, pkHash], 32)
  return prependZeroX(address.toString('hex'))
}

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
  createKeyPair,
  isPrivateKey,
  createA0Address,
  isAccountAddress,
  createChecksumAddress,
  isValidChecksumAddress,
  equalAddresses
}
