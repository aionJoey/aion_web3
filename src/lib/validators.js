let {isArray} = require('underscore')
let Ajv = require('ajv')
let ajv = new Ajv()

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))

let createValidator = schema => {
  let validator = ajv.compile(schema)
  return val => {
    let valid = validator(val)
    let errors = validator.errors
    let error = errors
    if (isArray(errors) === true) {
      error = errors[0]
    }
    return [valid, error]
  }
}

module.exports = {
  createValidator
}
