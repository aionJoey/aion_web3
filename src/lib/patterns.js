let patterns = Object.freeze({
  // starts with '0x'
  zeroX: /^0x/i,
  // starts with 0x or -0x
  zeroXNegative: /^(-)?0x/i,
  // positive or negative hex with optional 0x
  hex: /^(-0x|0x)?[0-9a-f]{1,}$/i,
  // positive or negative hex with 0x
  hexStrict: /^(-)?0x[0-9a-f]{1,}$/i,
  // aion-specific 0x0a
  address: /^(0x)?a0[0-9a-f]{62}$/i,
  // starts with utf8 null characters
  utf8Null: /^(?:\u0000)*/, // eslint-disable-line no-control-regex
  // matches solidity array types int128[64] or uint128[32]
  // captures array length
  typeNArray: /^\D{3,}\d{1,}\[(\d+)\]$/,
  // match int128 or uint128
  // captures byte size
  typeN: /^\D+(\d+).*$/,
  // if you have `unit128` just get `uint`
  solidityTypeNoLength: /^([a-z]{3,})/,
  // get [8] or []
  solidityDimensions: /(\[(\d{1,})\]|\[\])/g,
  // get the 8 from [8]
  solidityDimensionDigit: /\d{1,}/,
  // matches left-padded hex strings like 0000000FF
  leadingHexZeroPadding: /^(?:00)*/,
  // similar to typeNArray but just captures array length
  arraySizeDigit: /(?:\[)(\d+)/,
  // base64 encoding for buffers
  // https://stackoverflow.com/questions/475074/regex-to-parse-or-validate-base64-data
  base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  // used to check against IBAN addresses ../iban.js
  validIban: /^XE[0-9]{2}(AIO[0-9A-Z]{13}|[0-9A-Z]{30,31})$/
})

module.exports = patterns
