let BN = require('bn.js')
let padStart = require('lodash/padStart')
let patterns = require('./lib/patterns')
let values = require('./lib/values')
let {removeLeadingZeroX, prependZeroX} = require('./lib/formats')
let {isAccountAddress} = require('./lib/accounts')
let {toChecksumAddress} = require('./utils')

/**
 * Prepare an IBAN for mod 97 computation by moving the first 4 chars to the end
 * and transforming the letters to numbers (A = 10, B = 11, ..., Z = 35), as
 * specified in ISO13616.
 *
 * https://www.iso.org/standard/41031.html
 *
 * @method iso13616Prepare
 * @param {string} iban the IBAN
 * @returns {string} the prepared IBAN
 */
function iso13616Prepare(ibanAddress) {
  let A = 'A'.charCodeAt(0)
  let Z = 'Z'.charCodeAt(0)

  let op = ibanAddress.toUpperCase()
  op = op.substr(4) + op.substr(0, 4)

  return op
    .split('')
    .map(function(n) {
      let code = n.charCodeAt(0)
      if (code >= A && code <= Z) {
        // A = 10, B = 11, ... Z = 35
        return code - A + 10
      } else {
        return n
      }
    })
    .join('')
}

/**
 * Calculates the MOD 97 10 of the passed IBAN as specified in ISO7064.
 *
 * https://github.com/stvkoch/ISO7064-Mod-97-10
 * https://en.wikipedia.org/wiki/ISO_7064
 * https://www.iso.org/standard/31531.html
 *
 * @method mod9710
 * @param {string} ibanAddress
 * @returns {number}
 */
function mod9710(ibanAddress) {
  let remainder = ibanAddress
  let block

  while (remainder.length > 2) {
    block = remainder.slice(0, 9)
    remainder = parseInt(block, 10) % 97
    remainder += remainder.slice(block.length)
  }

  return parseInt(remainder, 10) % 97
}

function isDirectIbanAddress({length}) {
  return length === 34 || length === 35
}

function isIndirectIbanAddress({length}) {
  return length === 20
}

function ibanToAion(ibanAddress) {
  if (isDirectIbanAddress(ibanAddress) === true) {
    let base36 = ibanAddress.substr(4)
    let asBn = new BN(base36, 36)
    asBn = asBn.toString(16, values.addresses.bytesLength)
    asBN = prependZeroX(asBn)
    return toChecksumAddress(asBn)
  }

  return ''
}

function bbanToIban(bbanAddress) {
  let countryCode = 'XE'
  let remainder = mod9710(iso13616Prepare(countryCode + '00' + bbanAddress))
  let checkDigit = ('0' + (98 - remainder)).slice(-2)
  return countryCode + checkDigit + bbanAddress
}

/**
 * Convert Aion address to BBAN then to IBAN address
 * @param {string} aionAddress
 * @return {string}
 */
function aionToIban(aionAddress) {
  if (isAccountAddress(aionAddress) === false) {
    throw new Error(`expecting a valid Aion address ${aionAddress}`)
  }

  let address = removeLeadingZeroX(aionAddress)
  let asBn = new BN(address, 16)
  let base36 = asBn.toString(36)
  let padded = padStart(base36, 15, '0')
  return bbanToIban(padded.toUpperCase())
}

function isValidIbanAddress(ibanAddress) {
  return patterns.validIban.test(ibanAddress) === true
}

function ibanAddressChecksum(ibanAddress) {
  return ibanAddress.substr(2, 2)
}

function Iban(ibanAddress) {
  // ethereum web3 doesn't validate on the way in so it can cause problems if we do
  /*if (isValidIbanAddress(ibanAddress) === false) {
    throw new Error(`the IBAN address was invalid ${ibanAddress}`)
  }*/

  this._ibanAddress = ibanAddress
}

/*

Iban instance members

*/

/**
 * Convert IBAN to Aion address
 * @param {[type]} ibanAddress [description]
 * @return {[type]} [description]
 */
Iban.prototype.toAddress = function(ibanAddress) {
  return ibanToAion(ibanAddress || this._ibanAddress)
}

/**
 * Convert an Aion address into an Iban object
 * @param {string} aionAddress
 * @return {object}
 */
Iban.prototype.toIban = function(aionAddress) {
  return aionToIban(aionAddress || this.aionAddress)
}

/**
 * Create an Iban from **aion** address
 *
 * It's still named fromEthereumAddress for API compatibility
 *
 * @param {string} aionAddress
 * @return {object}
 */
Iban.prototype.fromEthereumAddress = function(aionAddress) {
  return new Iban(aionToIban(aionAddress))
}

/**
 * Create Iban instance from BBAN address
 * @param {string} bbanAddress
 * @return {object}
 */
Iban.prototype.fromBban = function(bbanAddress) {
  return new Iban(bbanToIban(bbanAddress))
}

/**
 * Use institution and identifier to create BBAN and then IBAN
 * @param {string} options.institution
 * @param {string} options.identifier
 * @return {object}
 */
Iban.prototype.createIndirect = function({institution, identifier}) {
  if (institution === undefined || identifier === undefined) {
    throw new Error(`createIndirect takes {institution, identifier}`)
  }

  return new Iban(bbanToIban('AIO' + institution + identifier))
}

/**
 * Check if the address is valid
 * @param {string} [ibanAddress]
 * @return {boolean}
 */
Iban.prototype.isValid = function(ibanAddress) {
  return isValidIbanAddress(ibanAddress || this._ibanAddress)
}

/**
 * IBAN address is direct
 * @param {string} [ibanAddress]
 * @return {boolean}
 */
Iban.prototype.isDirect = function(ibanAddress) {
  return isDirectIbanAddress(ibanAddress || this._ibanAddress)
}

/**
 * IBAN address is indirect
 * @param {string} [ibanAddress]
 * @return {Boolean}
 */
Iban.prototype.isIndirect = function(ibanAddress) {
  return isIndirectIbanAddress(ibanAddress || this._ibanAddress)
}

/**
 * Output checksum address
 * @param {string} [ibanAddress]
 * @return {string} [description]
 */
Iban.prototype.checksum = function(ibanAddress) {
  return ibanAddressChecksum(ibanAddress || this._ibanAddress)
}

/**
 * Get the institution part of the address
 * @return {string}
 */
Iban.prototype.institution = function() {
  return this.isIndirect() === true ? this._ibanAddress.substr(7, 4) : ''
}

/**
 * Get the client part of the address
 * @return {string} [description]
 */
Iban.prototype.client = function() {
  return this.isIndirect() === true ? this._ibanAddress.substr(11) : ''
}

/**
 * Get the IBAN address
 * @return {string} [description]
 */
Iban.prototype.toString = function() {
  return this._ibanAddress
}

/*

Iban static members

*/

/**
 * Convert IBAN to Aion address
 * @param {string} address
 * @return {string}
 */
Iban.toAddress = function(ibanAddress) {
  return ibanToAion(ibanAddress)
}

/**
 * Convert Aion address to IBAN address
 *
 * @method toIban
 * @param {string} address
 * @return {string} the IBAN address
 */
Iban.toIban = function(address) {
  return aionToIban(address)
}

/**
 * Create Iban instance from BBAN address
 * @param {string} bbanAddress
 * @return {object}
 */
Iban.fromBban = function(bbanAddress) {
  return new Iban(bbanToIban(bbanAddress))
}

/**
 * Check if the IBAN address is valid
 * @param {string} ibanAddress
 * @return {boolean}
 */
Iban.isValid = function(ibanAddress) {
  return isValidIbanAddress(ibanAddress)
}

/**
 * True if direct IBAN address
 * @param {string} ibanAddress
 * @return {boolean}
 */
Iban.isDirect = function(ibanAddress) {
  return isDirectIbanAddress(ibanAddress)
}

Iban.isIndirect = function(ibanAddress) {
  return isIndirectIbanAddress(ibanAddress)
}

Iban.checksum = function(ibanAddress) {
  return ibanAddressChecksum(ibanAddress)
}

module.exports = Iban
