let {isString, isNumber, isObject, isArray} = require('underscore')
let {isAccountAddress} = require('./lib/accounts')
let {prependZeroX, removeLeadingZeroX} = require('./lib/formats')

let {
  toBN,
  isHexStrict,
  numberToHex,
  isHex,
  utf8ToHex,
  hexToNumber,
  hexToUtf8,
  toChecksumAddress,
  sha3
} = require('./utils')

let iban = require('./iban')

let outputBigNumberFormatter = val => toBN(val).toString(10)

let isPredefinedBlockNumber = val =>
  val === 'latest' || val === 'pending' || val === 'earliest'

function inputDefaultBlockNumberFormatter(val) {
  if (this && (val === undefined || val === null)) {
    return this.defaultBlock
  }
  if (val === 'genesis' || val === 'earliest') {
    return '0x0'
  }
  return inputBlockNumberFormatter(val)
}

function inputBlockNumberFormatter(val) {
  if (val === undefined) {
    return undefined
  }

  if (isPredefinedBlockNumber(val)) {
    return val
  }

  if (isHexStrict(val) === true) {
    return isString(val) === true ? val.toLowerCase() : val
  }

  return numberToHex(val)
}

function txInputFormatter(options) {
  if (options.to) {
    // it might be contract creation
    options.to = inputAddressFormatter(options.to)
  }

  if (options.data && options.input) {
    throw new Error(
      'You can\'t have "data" and "input" as properties of transactions at the same time, please use either "data" or "input" instead.'
    )
  }

  if (!options.data && options.input) {
    options.data = options.input
    delete options.input
  }

  if (options.data && !isHex(options.data)) {
    throw new Error('The data field must be HEX encoded data.')
  }

  // allow both
  if (options.gas || options.gasLimit) {
    options.gas = options.gas || options.gasLimit
  }

  ;['gasPrice', 'gas', 'value', 'nonce']
    .filter(function(key) {
      return options[key] !== undefined
    })
    .forEach(function(key) {
      options[key] = numberToHex(options[key])
    })

  return options
}

function inputCallFormatter(options) {
  options = txInputFormatter(options)

  let from = options.from || (this ? this.defaultAccount : null)

  if (from) {
    options.from = inputAddressFormatter(from)
  }

  return options
}

function inputTransactionFormatter(options) {
  options = txInputFormatter(options)

  // check from, only if not number, or object
  if (!isNumber(options.from) && !isObject(options.from)) {
    options.from = options.from || (this ? this.defaultAccount : null)

    if (!options.from && !isNumber(options.from)) {
      throw new Error('The send transactions "from" field must be defined!')
    }

    options.from = inputAddressFormatter(options.from)
  }

  return options
}

function inputSignFormatter(data) {
  return isHexStrict(data) ? data : utf8ToHex(data)
}

function outputTransactionFormatter(tx) {
  if (tx.blockNumber !== null) tx.blockNumber = hexToNumber(tx.blockNumber)
  if (tx.transactionIndex !== null)
    tx.transactionIndex = hexToNumber(tx.transactionIndex)
  tx.nonce = hexToNumber(tx.nonce)
  tx.gas = hexToNumber(tx.gas)
  tx.gasPrice = outputBigNumberFormatter(tx.gasPrice)
  tx.value = outputBigNumberFormatter(tx.value)

  if (tx.to && isAccountAddress(tx.to)) {
    // tx.to could be `0x0` or `null` while contract creation
    tx.to = toChecksumAddress(tx.to)
  } else {
    tx.to = null // set to `null` if invalid address
  }

  if (tx.from) {
    tx.from = toChecksumAddress(tx.from)
  }

  return tx
}

function outputTransactionReceiptFormatter(receipt) {
  if (typeof receipt !== 'object') {
    throw new Error('Received receipt is invalid: ' + receipt)
  }

  if (receipt.blockNumber !== null)
    receipt.blockNumber = hexToNumber(receipt.blockNumber)
  if (receipt.transactionIndex !== null)
    receipt.transactionIndex = hexToNumber(receipt.transactionIndex)
  receipt.cumulativeGasUsed = hexToNumber(receipt.cumulativeGasUsed)
  receipt.gasUsed = hexToNumber(receipt.gasUsed)

  if (isArray(receipt.logs)) {
    receipt.logs = receipt.logs.map(outputLogFormatter)
  }

  if (receipt.contractAddress) {
    receipt.contractAddress = toChecksumAddress(receipt.contractAddress)
  }

  if (typeof receipt.status !== 'undefined') {
    receipt.status = Boolean(parseInt(receipt.status))
  }

  return receipt
}

function outputBlockFormatter(block) {
  // transform to number
  block.gasLimit = hexToNumber(block.gasLimit)
  block.gasUsed = hexToNumber(block.gasUsed)
  block.size = hexToNumber(block.size)
  block.timestamp = hexToNumber(block.timestamp)
  if (block.number !== null) block.number = hexToNumber(block.number)

  if (block.difficulty)
    block.difficulty = outputBigNumberFormatter(block.difficulty)
  if (block.totalDifficulty)
    block.totalDifficulty = outputBigNumberFormatter(block.totalDifficulty)

  if (isArray(block.transactions)) {
    block.transactions.forEach(function(item) {
      if (!isString(item)) return outputTransactionFormatter(item)
    })
  }

  if (block.miner) block.miner = toChecksumAddress(block.miner)

  return block
}

function inputLogFormatter(options) {
  function toTopic(value) {
    if (value === null || typeof value === 'undefined') return null

    value = String(value)

    if (value.indexOf('0x') === 0) return value
    else return utf8ToHex(value)
  }

  // make sure topics, get converted to hex
  options.topics = options.topics || []
  options.topics = options.topics.map(function(topic) {
    return isArray(topic) ? topic.map(toTopic) : toTopic(topic)
  })

  if (options.address !== undefined) {
    if (isArray(options.address) === true) {
      options.address = options.address.map(function(addr) {
        return inputAddressFormatter(addr)
      })
    } else {
      options.address = inputAddressFormatter(options.address)
    }
  }

  return options
}

function outputLogFormatter(log) {
  // generate a custom log id
  if (
    typeof log.blockHash === 'string' &&
    typeof log.transactionHash === 'string' &&
    typeof log.logIndex === 'string'
  ) {
    let shaId = sha3(
      log.blockHash.replace('0x', '') +
        log.transactionHash.replace('0x', '') +
        log.logIndex.replace('0x', '')
    )
    log.id = 'log_' + shaId.replace('0x', '').substr(0, 8)
  } else if (!log.id) {
    log.id = null
  }

  if (log.blockNumber !== null) log.blockNumber = hexToNumber(log.blockNumber)
  if (log.transactionIndex !== null)
    log.transactionIndex = hexToNumber(log.transactionIndex)
  if (log.logIndex !== null) log.logIndex = hexToNumber(log.logIndex)

  if (log.address) {
    log.address = toChecksumAddress(log.address)
  }

  return log
}

function inputPostFormatter(post) {
  // post.payload = toHex(post.payload);

  if (post.ttl) post.ttl = numberToHex(post.ttl)
  if (post.workToProve) post.workToProve = numberToHex(post.workToProve)
  if (post.priority) post.priority = numberToHex(post.priority)

  // fallback
  if (!isArray(post.topics)) {
    post.topics = post.topics ? [post.topics] : []
  }

  // format the following options
  post.topics = post.topics.map(function(topic) {
    // convert only if not hex
    return topic.indexOf('0x') === 0 ? topic : utf8ToHex(topic)
  })

  return post
}

/**
 * Formats the output of a received post message
 *
 * @param {object} post
 * @returns {object}
 */
function outputPostFormatter(post) {
  post.expiry = hexToNumber(post.expiry)
  post.sent = hexToNumber(post.sent)
  post.ttl = hexToNumber(post.ttl)
  post.workProved = hexToNumber(post.workProved)
  // post.payloadRaw = post.payload;
  // post.payload = hexToAscii(post.payload);

  // if (isJson(post.payload)) {
  //     post.payload = JSON.parse(post.payload);
  // }

  // format the following options
  if (!post.topics) {
    post.topics = []
  }
  post.topics = post.topics.map(function(topic) {
    return hexToUtf8(topic)
  })

  return post
}

function inputAddressFormatter(addr) {
  if (iban.isValid(addr) === true && iban.isDirect(addr) === true) {
    return iban.toAddress(addr).toLowerCase()
  }

  if (isAccountAddress(addr) === true) {
    return prependZeroX(removeLeadingZeroX(addr.toLowerCase()))
  }

  throw new Error(
    'Provided address "' +
      addr +
      '" is invalid, the capitalization checksum test failed, or its an indrect IBAN address which can\'t be converted.'
  )
}

function outputSyncingFormatter(result) {
  result.startingBlock = hexToNumber(result.startingBlock)
  result.currentBlock = hexToNumber(result.currentBlock)
  result.highestBlock = hexToNumber(result.highestBlock)
  if (result.knownStates) {
    result.knownStates = hexToNumber(result.knownStates)
    result.pulledStates = hexToNumber(result.pulledStates)
  }

  return result
}

module.exports = {
  outputBigNumberFormatter,
  isPredefinedBlockNumber,
  inputDefaultBlockNumberFormatter,
  inputBlockNumberFormatter,
  inputCallFormatter,
  inputTransactionFormatter,
  inputSignFormatter,
  outputTransactionFormatter,
  outputTransactionReceiptFormatter,
  outputBlockFormatter,
  inputLogFormatter,
  outputLogFormatter,
  inputPostFormatter,
  outputPostFormatter,
  inputAddressFormatter,
  outputSyncingFormatter
}
