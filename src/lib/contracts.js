let {createValidator} = require('./validators')

//
// contract function interface schema
//
let functionInterfaceSchema = {
  type: 'object',
  required: ['type', 'name', 'inputs'],
  properties: {
    type: {type: 'string', enum: ['function', 'constructor', 'fallback']},
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

//
// contract event interface schema
//
let eventInterfaceSchema = {
  type: 'object',
  required: ['type', 'name', 'inputs', 'anonymous'],
  properties: {
    type: {type: 'string', enum: ['event']},
    name: {type: 'string'},
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type', 'indexed'],
        properties: {
          name: {type: 'string'},
          type: {type: 'string'},
          indexed: {type: 'boolean'}
        }
      }
    }
  }
}

let functionInterfaceValidator = createValidator(functionInterfaceSchema)

let eventInterfaceValidator = createValidator(eventInterfaceSchema)

module.exports = {
  functionInterfaceValidator,
  eventInterfaceValidator
}
