let {isEmpty} = require('underscore')
let get = require('lodash/get')
let patterns = require('./patterns')
let values = require('./values')

/*

solidity type-specific information

*/
let types = {
  function: {
    length: 4
  },
  bool: {
    pad: 'left'
  },
  uint: {
    pad: 'left'
  },
  int: {
    pad: 'left'
  },
  fixed: {
    pad: 'left'
  },
  ufixed: {
    pad: 'left'
  },
  address: {
    // acts as uint
    pad: 'left'
  },
  bytes: {
    pad: 'right',
    dynamic: true
  },
  string: {
    pad: 'right',
    dynamic: true
  }
}

function isSolidityArrayType(val) {
  return (
    val.indexOf(values.solidity.dimensionStartChar) > -1 &&
    val.indexOf(values.solidity.dimensionEndChar) > -1
  )
}

function isSolidityDynamicType(val) {
  let dyn = get(types, `${val}.dynamic`)
  return dyn === true || val.indexOf(values.solidity.dimensionsDynamic) > -1
}

/**
 * Parse the solidity type and give relevant information such is dimensions
 * @param {string} val
 * @return {object}
 */
function parseType(val) {
  let op = {}
  let baseType = patterns.solidityTypeNoLength.exec(val)
  let byteLength = patterns.typeN.exec(val)
  let dimensions = val.match(patterns.solidityDimensions)

  if (isEmpty(baseType) === false) {
    op.baseType = baseType[1]
  }

  if (isEmpty(byteLength) === false) {
    op.byteLength = parseInt(byteLength[1], 10)
  }

  op.array = isSolidityArrayType(val)
  op.dynamic = isSolidityDynamicType(val) || isSolidityDynamicType(baseType)

  if (isEmpty(dimensions) === false) {
    op.dimensions = dimensions.map((item, index) => {
      let op = {index}
      let digit = item.match(patterns.solidityDimensionDigit)
      if (isEmpty(digit) === false) {
        op.length = parseInt(digit[0], 10)
      }
      return op
    })
  }

  return op
}

module.exports = {
  types,
  parseType
}
