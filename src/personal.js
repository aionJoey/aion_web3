let {assignExtend} = require('./extend.js')
let {assignProvider} = require('./providers.js')
let BatchRequest = require('./batch-request')

let {toChecksumAddress} = require('./utils')

let {
  inputAddressFormatter,
  inputTransactionFormatter,
  inputSignFormatter
} = require('./formatters')

let methods = [
  {
    name: 'getAccounts',
    call: 'personal_listAccounts',
    params: 0,
    outputFormatter: toChecksumAddress
  },
  {
    name: 'newAccount',
    call: 'personal_newAccount',
    params: 1,
    inputFormatter: [null],
    outputFormatter: toChecksumAddress
  },
  {
    name: 'unlockAccount',
    call: 'personal_unlockAccount',
    params: 3,
    inputFormatter: [inputAddressFormatter, null, null]
  },
  {
    name: 'lockAccount',
    call: 'personal_lockAccount',
    params: 1,
    inputFormatter: [inputAddressFormatter]
  },
  {
    name: 'importRawKey',
    call: 'personal_importRawKey',
    params: 2
  },
  {
    name: 'sendTransaction',
    call: 'personal_sendTransaction',
    params: 2,
    inputFormatter: [inputTransactionFormatter, null]
  },
  {
    name: 'signTransaction',
    call: 'personal_signTransaction',
    params: 2,
    inputFormatter: [inputTransactionFormatter, null]
  },
  {
    name: 'sign',
    call: 'personal_sign',
    params: 3,
    inputFormatter: [inputSignFormatter, inputAddressFormatter, null]
  },
  {
    name: 'ecRecover',
    call: 'personal_ecRecover',
    params: 2,
    inputFormatter: [inputSignFormatter, null]
  }
]

function Personal(provider, providerOpts) {
  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})
}

Personal.prototype.BatchRequest = BatchRequest

module.exports = Personal
