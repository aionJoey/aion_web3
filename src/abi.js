let padStart = require('lodash/padStart')
let padEnd = require('lodash/padEnd')

let {isString, isObject, isEmpty, each, flatten} = require('underscore')

let {
  copyString,
  prependZeroX,
  toBuffer,
  removeLeadingZeroX
} = require('./lib/formats')

let {keccak256} = require('./lib/crypto')
let solidity = require('./lib/solidity')
let values = require('./lib/values')

/**
 * Shared between function and event signatures. Hashes the function name
 * @param {string} val
 * @return {string} hash
 */
function fnHashBuffer(val) {
  let op

  if (isString(val) === true) {
    op = copyString(val)
  }

  if (isObject(val) === true) {
    op = copyString(val.name)

    if (isEmpty(val.inputs) === false) {
      op += '(' + val.inputs.map(item => item.type).join(',') + ')'
    }
  }

  return keccak256(op)
}

let hexStringPadLeft = val =>
  padStart(val, values.solidity.typeStringLength, '0')

let hexStringPadRight = val =>
  padEnd(val, values.solidity.typeStringLength, '0')

let dimensionSorter = (a, b) => a.index > b.index

function encodeAbiString(val) {
  let length = hexStringPadLeft(val.length.toString(16))
  let stringValue = hexStringPadRight(toBuffer(val, 'utf8').toString('hex'))
  return `${length}${stringValue}`
}

function encodeAbiBoolean(val) {
  return copyString(
    val === true ? values.solidity.boolean.one : values.solidity.boolean.zero
  )
}

function encodeAbiNumber(val) {
  return hexStringPadLeft(toBuffer(val).toString('hex'))
}

function encodeAbiAddress(val) {
  return removeLeadingZeroX(val)
}

let abiTypeEncoders = {
  string: encodeAbiString,
  bytes: encodeAbiString,
  bool: encodeAbiBoolean,
  uint: encodeAbiNumber,
  int: encodeAbiNumber,
  fixed: encodeAbiNumber,
  ufixed: encodeAbiNumber,
  address: encodeAbiAddress
}

/**
 * Encode event to its ABI signature
 * @param {string|object} val
 * @return {string}
 */
function encodeEventSignature(val) {
  return prependZeroX(fnHashBuffer(val).toString('hex'))
}

/**
 * Encode function to its ABI signature
 * @param {string|object} val
 * @return {string}
 */
function encodeFunctionSignature(val) {
  return prependZeroX(
    fnHashBuffer(val)
      .slice(0, solidity.types.function.length)
      .toString('hex')
  )
}

/**
 * Encode a list of parameters to ABI signature
 * @param {array} types
 * @param {array} params
 * @return {string}
 */
function encodeParameters(types, params) {
  // parse all the types
  let parsedTypes = types.map(solidity.parseType)
  let op = []

  // if any are dynamic we must use offsets
  // let needsOffsets = parsedTypes.some(item => item.dynamic === true)

  each(params, (typeValues, index) => {
    let {baseType, array, dynamic, dimensions} = parsedTypes[index]
    let valueParser = abiTypeEncoders[baseType]
    dimensions = dimensions.sort(dimensionSorter)

    if (array === true) {
      let typeOp = []

      if (dynamic === true) {
        let offset = encodeAbiNumber(
          toBuffer(flatten(op).join(''), 'hex').length
        )
        typeOp.push(offset)
      }

      let length = encodeAbiNumber(typeValues.length)
      typeOp.push(length)

      each(typeValues, item => {
        let parsedItem = valueParser(item)
        typeOp.push(parsedItem)
      })

      return op.push(typeOp)
    }

    op.push(valueParser(typeValues))
  })

  return prependZeroX(flatten(op).join(''))
}

/**
 * Encode parameter to ABI signature
 * @param {string} type
 * @param {string|array|object} param
 * @return {string}
 */
function encodeParameter(type, param) {
  return encodeParameters([type], [param])
}

/**
 * Encode function call to ABI signature
 * @param {object} jsonInterface
 * @param {array} params
 * @return {string}
 */
function encodeFunctionCall(jsonInterface, params) {}

/**
 * Decode a parameter value from it's ABI encoding
 * @param {string} type
 * @param {string} val
 * @return {string}
 */
function decodeParameter(type, val) {}

/**
 * Decode the parameters hex into an array of decoded values
 * @param {array} types
 * @param {string} val
 * @return {array} [description]
 */
function decodeParameters(types, val) {}

/**
 * ABI decoded log data
 * @param {array} inputs
 * @param {string} val
 * @param {array} topics
 * @return {array}
 */
function decodeLog(inputs, val, topics) {}

module.exports = {
  encodeFunctionSignature,
  encodeEventSignature,
  encodeParameter,
  encodeParameters,
  encodeFunctionCall,
  decodeParameter,
  decodeParameters,
  decodeLog
}
