let {createValidator} = require('./validators')

let jsonInterfaceSchema = {
  type: 'object',
  properties: {
    type: {fn: true},
    name: {type: 'string'},
    constant: {type: 'boolean'},
    payable: {type: 'boolean'},
    stateMutability: {
      type: 'string',
      enum: ['pure', 'view', 'constant', 'nonpayable', 'payable']
    },
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          type: {type: 'string'}
        }
      }
    },
    outputs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          type: {type: 'string'}
        }
      }
    }
  }
}

let jsonInterfaceValidator = createValidator(jsonInterfaceSchema)

module.exports = {jsonInterfaceValidator}
