let randomHex = require('randomhex')
let numberToBn = require('number-to-bn')
let {Buffer} = require('safe-buffer')
let {isEmpty, isArray, isString, isNumber} = require('underscore')
let BN = require('bn.js')
let values = require('./values')
let patterns = require('./patterns')

let copyString = val => '' + val

/**
 * True if string starts with '0x'
 * @param {string} val
 * @return {boolean}
 */
let startsWithZeroX = val =>
  isString(val) === true && patterns.zeroX.test(val) === true

/**
 * Removes '0x' from a string
 * @private
 * @param {string} val
 * @return {string}checkAddressChecksum
 */
let removeLeadingZeroX = val =>
  startsWithZeroX(val) === true ? val.replace(patterns.zeroX, '') : val

/**
 * Put the 0x at the beginning of a string
 * @private
 * @param {string} val
 * @return {string}
 */
let prependZeroX = val =>
  startsWithZeroX(val) === false ? values.zeroX + val : val

/**
 * Strips '0x' and turns it into a Buffer
 * @param {string} val [description]
 * @return {buffer} [description]
 */
let hexToBuffer = val => toBuffer(val)

/**
 * Random Buffer of a size
 * @param {number} size
 * @return {buffer}
 */
let randomHexBuffer = (size = values.hex.randomHexSize) =>
  hexToBuffer(randomHex(size))

/**
 * True if a string is hex
 * @param {string} val
 * @return {boolean}
 */
let isHex = val => isString(val) === true && patterns.hex.test(val) === true

/**
 * True if two buffers have the same length and bytes
 * @param {buffer} buf1
 * @param {buffer} buf2
 * @return {boolean}
 */
function equalBuffers(buf1, buf2) {
  if (buf1.length !== buf2.length) {
    return false
  }

  return buf1.every((byte, index) => {
    return (buf2[index] = byte)
  })
}

/**
 * Gracefully try to convert anything into a buffer
 * @param {object} val anything
 * @param {string} encoding hex, base64, utf8
 * @return {buffer}
 */
function toBuffer(val, encoding) {
  // buffer or array
  if (isArray(val) === true || Buffer.isBuffer(val) === true) {
    return Buffer.from(val)
  }

  if (isNaN(val) === false || isNumber(val) === true || BN.isBN(val) === true) {
    return Buffer.from(numberToBn(val).toString('hex'), 'hex')
  }

  // string
  if (isString(val) === true && isEmpty(encoding) === true) {
    // hex
    if (isHex(val) === true) {
      return Buffer.from(removeLeadingZeroX(val), 'hex')
    }

    // base64
    if (patterns.base64.test(val) === true) {
      return Buffer.from(val, 'base64')
    }
  }

  // anything else
  return Buffer.from(val, encoding)
}

let isBuffer = val => Buffer.isBuffer(val)

function toNumber(val) {
  if (typeof val === 'number') {
    return val
  }

  if (isHex(val) === true) {
    return new BN(removeLeadingZeroX(val), 'hex').toNumber()
  }

  if (BN.isBN(val) === true) {
    return val.toNumber()
  }

  throw new Error(`unknown format "${typeof val}" ${val}`)
}

module.exports = {
  copyString,
  startsWithZeroX,
  removeLeadingZeroX,
  prependZeroX,
  hexToBuffer,
  randomHexBuffer,
  Buffer,
  equalBuffers,
  toBuffer,
  isBuffer,
  isHex,
  toNumber
}
