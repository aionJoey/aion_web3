let {assignExtend} = require('./extend.js')
let {assignProvider} = require('./providers.js')
let utils = require('./utils')
let formatters = require('./formatters')
let BatchRequest = require('./batch-request')

let methods = [
  {
    name: 'getAccounts',
    call: 'personal_listAccounts',
    params: 0,
    outputFormatter: utils.toChecksumAddress
  },
  {
    name: 'newAccount',
    call: 'personal_newAccount',
    params: 1,
    inputFormatter: [null],
    outputFormatter: utils.toChecksumAddress
  },
  {
    name: 'unlockAccount',
    call: 'personal_unlockAccount',
    params: 3,
    inputFormatter: [formatters.inputAddressFormatter, null, null]
  },
  {
    name: 'lockAccount',
    call: 'personal_lockAccount',
    params: 1,
    inputFormatter: [formatters.inputAddressFormatter]
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
    inputFormatter: [formatters.inputTransactionFormatter, null]
  },
  {
    name: 'signTransaction',
    call: 'personal_signTransaction',
    params: 2,
    inputFormatter: [formatters.inputTransactionFormatter, null]
  },
  {
    name: 'sign',
    call: 'personal_sign',
    params: 3,
    inputFormatter: [
      formatters.inputSignFormatter,
      formatters.inputAddressFormatter,
      null
    ]
  },
  {
    name: 'ecRecover',
    call: 'personal_ecRecover',
    params: 2,
    inputFormatter: [formatters.inputSignFormatter, null]
  }
]

function Personal(provider, providerOpts) {
  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})
}

Personal.prototype.BatchRequest = BatchRequest

module.exports = Personal
