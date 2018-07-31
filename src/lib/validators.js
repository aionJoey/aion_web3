let {isEmpty} = require('underscore')
let Ajv = require('ajv')
let ajv = new Ajv()

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))

function parseError(jsonSchemaError) {
  let {keyword, dataPath, schemaPath, params, message} = jsonSchemaError
  let err = new Error(`
    Data path "${dataPath}" had a problem validating "${keyword}"
    ---
    schema path: ${schemaPath}
         params: ${JSON.stringify(params)}
        message: ${message}
  `)
  err.jsonSchemaError = jsonSchemaError
  return err
}

function createValidator(schema) {
  let validator = ajv.compile(schema)
  return function createValidatorInner(val) {
    let valid = validator(val)
    let error
    if (isEmpty(validator.errors) === false) {
      error = parseError(validator.errors[0])
    }
    return [valid, error]
  }
}

module.exports = {
  createValidator
}
