/**
 * @module utils
 */

let {Buffer} = require('safe-buffer')
let BN = require('bn.js')

let numberToBn = require('number-to-bn')
let randomhex = require('randomhex')
let utf8 = require('utf8')

let _ = require('underscore')

let {isObject, isString, isNumber, isEqual, isArray, isBoolean, each} = _

let get = require('lodash/get')
let accounts = require('./lib/accounts')
let values = require('./lib/values')
let patterns = require('./lib/patterns')
let crypto = require('./lib/crypto')
let {
  removeLeadingZeroX,
  prependZeroX,
  startsWithZeroX,
  copyString,
  toBuffer
} = require('./lib/formats')

/**
 * Generate random hex values of a certain length
 * @param {number} size how many bytes
 * @return {string} randomly generated hex value starting with '0x'
 */
let randomHex = size => randomhex(size)

/**
 *
 * @member _
 * @type {function}
 */
// utils._ = _

/**
 * Constructor for bn.js
 *
 * It would be the same as `require('bn.js')`
 *
 * @constructor BN
 * @member BN
 */
// utils.BN = BN

/**
 * Convert number to BN
 */
let toBN = val => numberToBn(val)

/**
 * Get the constructor of whatever is passed in
 * @access private
 * @param {object} obj
 * @returns {string} constructor name
 */
let getConstructor = val => get(val, 'constructor.name')

/**
 * BN.isBN
 * @param {object} val
 * @returns {boolean}
 */
let isBN = val => BN.isBN(val)

/**
 * Is it a `BigNumber` or not?
 * @param {object} obj
 * @return {boolean}
 */
let isBigNumber = obj => getConstructor(obj) === 'BigNumber'

/**
 * Checks if a value is a hex value
 *
 * 0x number expressions return false but '0x' string expressions true
 *
 * @param {string} val
 * @return {boolean}
 */
let isHex = val =>
  (isString(val) === true || isNumber(val) === true) &&
  patterns.hex.test(val) === true

/**
 * Checks if a value is hex starting with '0x'
 * @param {string} val
 * @return {boolean}
 */
let isHexStrict = val =>
  (isString(val) === true || isNumber(val) === true) &&
  patterns.hexStrict.test(val) === true

/**
 * Reduce function for hexToBytes. It splits by each two characters.
 * e.g. ['ff', 'aa', 'f5', '55']
 * @return {array} array of hex bytes
 */
function hexToBytesReduction(acm, item, index, arr) {
  if (index % 2 === 0 && index <= arr.length - 2) {
    acm.push(item + arr[index + 1])
  }

  return acm
}

/**
 * Convert a hex string to a byte array
 *
 * @param {string|number|BN} hex
 * @return {array} the byte array
 */
function hexToBytes(val) {
  if (
    typeof val === 'string' &&
    val.length % 2 !== 0 &&
    isHexStrict(val) === false
  ) {
    throw new Error('utils.hexToBytes requires a valid hex string')
  }

  let op

  if (typeof val === 'number') {
    op = toBN(val).toString('hex')
  }

  if (isBN(val) === true || isBigNumber(val) === true) {
    op = val.toString('hex')
  }

  if (typeof val === 'string') {
    op = copyString(val)
  }

  return removeLeadingZeroX(op)
    .split('')
    .reduce(hexToBytesReduction, [])
    .map(item => parseInt(item, 16))
}

function createPadder(direction) {
  return function createPadderInternal(val, length = 1, sign = '0') {
    let padding = ''
    let isHex =
      typeof val === 'number' ||
      startsWithZeroX(val) === true ||
      isBN(val) === true ||
      isBigNumber(val) === true
    let offset = isHex === true ? 2 : 0
    let valLen =
      isHex === true ? toBN(val).toString('hex').length + 2 : val.length
    let iterations = length - valLen + offset
    for (let i = 0; i < iterations; i += 1) {
      padding += sign
    }

    let op = ''

    if (isHex === true) {
      op = removeLeadingZeroX(toBN(val).toString('hex'))
    }

    if (isHex === false && typeof val === 'string') {
      op = copyString(val)
    }

    if (direction === 'left') {
      op = `${padding}${op}`
    }

    if (direction === 'right') {
      op = `${op}${padding}`
    }

    if (isHex === true) {
      op = prependZeroX(op)
    }

    return op
  }
}

/**
 * Put padding to the left. The default padding sign is '0'
 * @param {string|number|BN|BigNumber} val
 * @param {number} length how many of the pad sign
 * @param {string} sign
 */
let padLeft = createPadder('left')

/**
 * Alias to padLeft
 */
let leftPad = padLeft

/**
 * Put padding to the right. The default padding sign is '0'
 * @param {string|number|BN|BigNumber} val
 * @param {number} quantity how many of the pad sign
 * @param {string} sign
 */
let padRight = createPadder('right')

/**
 * Alias to padRight
 */
let rightPad = padRight

/**
 * Convert array of bytes into hex string with 0x prepended
 * @param {array} val bytes
 * @return {string}
 */
let bytesToHex = val => prependZeroX(toBuffer(val).toString('hex'))

/**
 * Compute SHA3 256 length hash a.k.a. keccak256
 *
 * Prepends '0x' string to the result
 *
 * @param {string|array} val
 * @return {string} keccak256 hash
 */
function sha3(val) {
  // our keccak256 implementation or ethereum web3 don't accept these values
  if (
    val === undefined ||
    val === null ||
    // not having slice meaning it's not an array-like thing
    (typeof val !== 'string' &&
      get(val, 'slice') === undefined &&
      isBN(val) === false)
  ) {
    throw new Error(`utils.sha3 invalid value: "${val}"`)
  }

  let isSha3Null = false

  // there's a list of things ethereum web3 returns null for so we do too
  each(values.sha3.nulls, item => {
    if (isEqual(item, val) === true) {
      isSha3Null = true
    }
  })

  // ethereum web3 returns null
  if (isSha3Null === true) {
    return null
  }

  let op

  if (typeof val === 'string') {
    // copy the string
    op = copyString(val)

    if (startsWithZeroX(op) === true) {
      // the user passed in a string like '0xdccd2e7f400ab38e'
      op = hexToBytes(op)
    }
  }

  if (isBN(val) === true) {
    op = val.toString()
  }

  op = crypto.keccak256(op).toString('hex')

  if (op === values.sha3.nullHex) {
    return null
  }

  return `0x${op}`
}

/**
 * Alias to utils.sha3
 * @param {string|array} val
 * @return {string} keccak256 hash
 */
// utils.keccak256 = sha3

/**
 * True if valid Aion account address
 * @param {string} val
 * @return {boolean}
 */
let isAddress = val => accounts.isAccountAddress(val)

/**
 * Returns true if the address checksum calculates correctly
 * @param {string} val
 * @return {boolean}
 */
function checkAddressChecksum(val) {
  if (accounts.isAccountAddress(val) === false) {
    throw new Error(`not a valid Aion address: ${val}`)
  }

  return accounts.isValidChecksumAddress(val)
}

function utf8ToHex(val) {
  let op = utf8.encode(val)
  let hex = ''
  let code
  let codeString

  op = op.replace(patterns.utf8Null, '')
  op = op
    .split('')
    .reverse()
    .join('')
  op = op.replace(patterns.utf8Null, '')
  op = op
    .split('')
    .reverse()
    .join('')

  for (let i = 0; i < op.length; i++) {
    code = op.charCodeAt(i)
    codeString = code.toString(16)
    hex += codeString.length < 2 ? '0' + codeString : codeString
  }

  return '0x' + hex
}

function numberToHex(val) {
  if (val === undefined || val === null) {
    // should this warn? if the user thinks its a number but its not
    // it could cause other problems
    // console.warn('numberToHex, undefined or null', val)
    return val
  }

  if (isFinite(val) === false && isHexStrict(val) === false) {
    throw new Error('numberToHex expecting number and got something else')
  }

  let number = numberToBn(val)
  let result = number.toString(16)
  return number.lt(new BN(0)) ? '-0x' + result.substring(1) : '0x' + result
}

/**
 * It's used internally to convert addresses, booleans, objects, strings,
 * and numbers into hex for solidity sha3.
 * @param {object} val
 * @param {string} [returnType]
 * @return {string}
 */
function toHex(val, returnType) {
  let {maxIntSize, hex, zeroX} = values
  let {zero, one} = hex

  if (isAddress(val) === true) {
    return returnType
      ? 'address'
      : zeroX + removeLeadingZeroX(val.toLowerCase())
  }

  if (isBoolean(val) === true) {
    return returnType ? 'bool' : val ? one : zero
  }

  if (
    isObject(val) === true &&
    isBigNumber(val) === false &&
    isBN(val) === false
  ) {
    return returnType ? 'string' : utf8ToHex(JSON.stringify(val))
  }

  // if its a negative number, pass it through numberToHex
  if (isString(val) === true) {
    if (patterns.zeroXNegative.test(val) === true) {
      return returnType ? `int${maxIntSize}` : numberToHex(val)
    }

    if (startsWithZeroX(val) === true) {
      return returnType ? 'bytes' : val
    }

    if (isFinite(val) === false) {
      return returnType ? 'string' : utf8ToHex(val)
    }
  }

  if (returnType !== undefined) {
    if (val < 0) {
      return `int${maxIntSize}`
    }

    return `uint${maxIntSize}`
  }

  return numberToHex(val)
}

function elementaryName(name) {
  if (name.startsWith('int[') === true) {
    // for example appends '[45]'
    return 'int128' + name.slice(3)
  }
  if (name === 'int') {
    return 'int128'
  }
  if (name.startsWith('uint[') === true) {
    return 'uint128' + name.slice(4)
  }
  if (name === 'uint') {
    return 'uint128'
  }
  if (name.startsWith('fixed[') === true) {
    return 'fixed128x128' + name.slice(5)
  }
  if (name === 'fixed') {
    return 'fixed128x128'
  }
  if (name.startsWith('ufixed[') === true) {
    return 'ufixed128x128' + name.slice(6)
  }
  if (name === 'ufixed') {
    return 'ufixed128x128'
  }
  return name
}

function parseNumber(val) {
  let type = typeof val
  if (type === 'string') {
    if (isHexStrict(val) === true) {
      return new BN(removeLeadingZeroX(val), 16)
    }
    return new BN(val, 10)
  }
  if (type === 'number') {
    return new BN(val)
  }
  if (isBigNumber(val) === true) {
    return new BN(val.toString(10))
  }
  if (isBN(val) === true) {
    return val
  }
  throw new Error(`unable to parse type "${type}"`)
}

// Parse N from type<N>
function parseTypeN(type) {
  let typesize = patterns.typeN.exec(type)
  return typesize ? parseInt(typesize[1], 10) : null
}

function parseTypeNArray(type) {
  let arraySize = patterns.typeNArray.exec(type)
  return arraySize ? parseInt(arraySize[1], 10) : null
}

function solidityPack(type, value, arraySize) {
  let size
  let num
  let {maxIntSize} = values
  let {zero, one} = values.solidity.pack
  let padAmount
  type = elementaryName(type)

  if (type === 'bytes') {
    if (removeLeadingZeroX(value).length % 2 !== 0) {
      throw new Error('Invalid bytes characters ' + value.length)
    }

    return value
  }

  if (type === 'string') {
    return utf8ToHex(value)
  }

  if (type === 'bool') {
    return value ? one : zero
  }

  if (type.startsWith('address') === true) {
    size = values.addressLength

    if (isAddress(value) === false) {
      throw new Error(`"${value}" is not a valid address`)
    }

    return leftPad(value.toLowerCase(), size)
  }

  size = parseTypeN(type)

  if (type.startsWith('bytes') === true) {
    if (size === undefined) {
      throw new Error('bytes[] not yet supported in solidity')
    }

    // must be 32 byte slices when in an array
    if (isNumber(arraySize) === true) {
      size = 32
    }

    if (size < 1 || size > 32 || size < removeLeadingZeroX(value).length / 2) {
      throw new Error(`Invalid bytes${size} for ${value}`)
    }

    return rightPad(value, size * 2)
  }

  if (type.startsWith('uint') === true) {
    if (size % 8 || size < 8 || size > maxIntSize) {
      throw new Error(`invalid uint size: ${size}, max size: ${maxIntSize}`)
    }

    num = parseNumber(value)
    if (num.bitLength() > size) {
      throw new Error(
        'Supplied uint exceeds bit length: ' + size + ' vs ' + num.bitLength()
      )
    }

    if (num.lt(new BN(0)) === true) {
      throw new Error('Supplied uint ' + num.toString() + ' is negative')
    }

    // TODO: figure out these values
    padAmount = size / 8
    padAmount = padAmount * 2
    return size ? leftPad(num.toString('hex'), padAmount) : num
  }

  if (type.startsWith('int') === true) {
    if (size % 8 || size < 8 || size > maxIntSize) {
      throw new Error('Invalid int' + size + ' size')
    }

    num = parseNumber(value)

    if (num.bitLength() > size) {
      throw new Error(
        'Supplied int exceeds bit length: ' + size + ' vs ' + num.bitLength()
      )
    }

    if (num.lt(new BN(0)) === true) {
      return num.toTwos(size).toString('hex')
    }

    // TODO: figure out these values
    padAmount = size / 8
    padAmount = padAmount * 2
    return size ? leftPad(num.toString('hex'), padAmount) : num
  }

  // FIXME: support all other types
  throw new Error('Unsupported or invalid type: ' + type)
}

function soliditySortArg(item) {
  let type
  let value
  let arraySize
  let hexArg

  if (isArray(item) === true) {
    throw new Error(
      `soliditySha3 doesn't accept Array type because ethereum web3 doesn't`
    )
  }

  // { t: '', v: ''}
  // { type: '', value: ''}
  if (
    typeof item === 'object' &&
    (item.t !== undefined || item.type !== undefined) &&
    (item.v !== undefined || item.value !== undefined)
  ) {
    type = item.type || item.t
    value = item.value || item.v
  } else {
    /*

    this is a risky type inference and it turns utils.toHex into a complex
    function converting to hex in one instance and returning types in another.

    */
    type = toHex(item, true)
    value = toHex(item)

    if (type.startsWith('int') === false && type.startsWith('uint') === false) {
      type = 'bytes'
    }
  }

  if (
    type === 'bytes' &&
    isString(value) === true &&
    startsWithZeroX(value) === true &&
    removeLeadingZeroX(value).length % 2 !== 0
  ) {
    throw new Error(`
      soliditySha3 was expecting to get or convert to hex. This value's hex
      byte length was incorrect.
      type: ${type}
      value: ${value}
    `)
  }

  if (
    isArray(value) === false &&
    (type === 'int' ||
      type === 'uint' ||
      type.startsWith('int') === true ||
      type.startsWith('uint') === true)
  ) {
    value = numberToBn(value)
  }

  // get the array size
  if (isArray(value) === true) {
    arraySize = parseTypeNArray(type)
    if (isNumber(arraySize) === true && value.length !== arraySize) {
      let arr = JSON.stringify(value)
      throw new Error(`${type} is not matching the given array ${arr}`)
    } else {
      arraySize = value.length
    }
  }

  if (isArray(value) === true) {
    hexArg = value.map(item => {
      return removeLeadingZeroX(
        solidityPack(type, item, arraySize).toString('hex')
      )
    })
    return hexArg.join('')
  } else {
    hexArg = solidityPack(type, value, arraySize)
    return removeLeadingZeroX(hexArg.toString('hex'))
  }
}

/**
 * Converts all the arguments into some other format then hashes it with sha3.
 * @param args captures all arguments
 * @return {string}
 */
function soliditySha3(...args) {
  return sha3(prependZeroX(args.map(soliditySortArg).join('')))
}

/**
 * Convert an Aion address to an Aion Checksum address.
 *
 * Rather than being all lower or uppercase letters are upper or lower based
 * on some critera.
 *
 * @param {string} val
 * @return {string}
 */
let toChecksumAddress = val => {
  if (accounts.isAccountAddress(val) === false) {
    // this differs from how ethereum web3 does it
    // ethereum web3 returns a blank string
    // we throw if it's invalid
    throw new Error(`Given address "${val}" is not a valid Aion address.`)
  }

  return accounts.createChecksumAddress(val)
}

/**
 * Convert hex string to number string
 * @param {string} val
 * @return {string}
 */
let hexToNumberString = val => toBN(val).toString(10)

/**
 * Convert hex string to javascript number
 * @param {string} val
 * @return {number}
 */
let hexToNumber = val => toBN(val).toNumber()

/**
 * Convert hex string to utf8 string
 * @param {string} val
 * @return {string}
 */
function hexToUtf8(val) {
  // it removes 000000 padding
  let op = removeLeadingZeroX(val)
    .replace(patterns.leadingHexZeroPadding, '')
    .split('')
    .reverse()
    .join('')
    .replace(patterns.leadingHexZeroPadding, '')
    .split('')
    .reverse()
    .join('')

  op = prependZeroX(op)
  op = hexToBytes(op)
    .map(item => String.fromCharCode(item))
    .join('')

  return utf8.decode(op)
}

function hexToAscii(val) {
  return hexToBytes(val)
    .map(item => String.fromCharCode(item))
    .join('')
}

function asciiToHex(val) {
  if (val === undefined) {
    return copyString(values.hex.zero)
  }

  return prependZeroX(
    val
      .split('')
      .map(item => item.charCodeAt(0).toString(16))
      .join('')
  )
}

let toTwosComplement = val =>
  prependZeroX(
    toBN(val)
      .toTwos(256)
      .toString(16, 64)
  )

function blake2b256(val) {
  if (
    val === undefined ||
    val === null ||
    // not having slice meaning it's not an array-like thing
    (typeof val !== 'string' &&
      get(val, 'slice') === undefined &&
      isBN(val) === false)
  ) {
    throw new Error(`blake2b256 invalid value: "${val}"`)
  }

  let op

  if (typeof val === 'string') {
    // copy the string
    op = copyString(val)

    if (startsWithZeroX(op) === true) {
      // the user passed in a string like '0xdccd2e7f400ab38e'
      op = hexToBytes(op)
    } else {
      op = Buffer.from(op)
    }
  }

  if (isBN(val) === true) {
    op = Buffer.from(val.toString())
  }

  op = crypto.blake2b256(op)
  op = op.toString('hex')

  return `0x${op}`
}

module.exports = {
  // ethereum web3 implementations
  randomHex,
  _,
  BN,
  toBN,
  isBN,
  isBigNumber,
  isHex,
  isHexStrict,
  hexToBytes,
  bytesToHex,
  toHex,
  checkAddressChecksum,
  toChecksumAddress,
  utf8ToHex,
  isAddress,
  hexToNumberString,
  hexToNumber,
  numberToHex,
  hexToUtf8,
  hexToAscii,
  asciiToHex,
  padLeft,
  leftPad,
  padRight,
  rightPad,
  toTwosComplement,
  sha3,
  keccak256: sha3,
  soliditySha3,
  blake2b256
}
