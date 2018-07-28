let {createValidator} = require('./validators')

let transactionSchema = {
  type: 'object',
  required: [
    'to',
    'from',
    'data',
    'value',
    'gas',
    'gasLimit',
    'gasPrice',
    'nonce',
    'chainId'
  ],
  properties: {
    to: {type: 'string'},
    from: {type: 'string'},
    data: {type: 'string'},
    value: {type: 'string'},
    gas: {type: 'string'},
    gasLimit: {type: 'string'},
    gasPrice: {type: 'string'},
    nonce: {type: 'string'},
    chainId: {type: 'string'}
  }
}

let validateTransaction = createValidator(transactionSchema)

module.exports = {validateTransaction}
