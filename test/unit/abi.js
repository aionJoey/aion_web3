let abi = require('../../src/abi')
let cases = require('./fixtures').cases.abi

describe('abi', () => {
  it('encodeEventSignature', () => {
    let opts = {
      name: 'myEvent',
      type: 'event',
      inputs: [
        {
          type: 'uint128',
          name: 'myNumber'
        },
        {
          type: 'bytes32',
          name: 'myBytes'
        }
      ]
    }
    let op = abi.encodeEventSignature(opts)
    op.should.be.exactly(
      '0x2236226bdca8de2f2bc9a5be931cb54acc7d73c5a829b22dc2b7e92af174f7d4'
    )
    abi.encodeEventSignature('myEvent(uint128,bytes32)').should.be.exactly(op)
  })

  it('encodeFunctionSignature', () => {
    let opts = {
      name: 'myMethod',
      type: 'function',
      inputs: [
        {
          type: 'uint128',
          name: 'myNumber'
        },
        {
          type: 'string',
          name: 'myString'
        }
      ]
    }
    let op = abi.encodeFunctionSignature(opts)
    op.should.be.exactly('0xaaed82c1')
    abi
      .encodeFunctionSignature('myMethod(uint128,string)')
      .should.be.exactly(op)
  })

  it('encodeParametersIntermediate', () => {
    let {encodeParametersIntermediate} = abi
    cases.forEach(({types, params, expected}) => {
      let op = encodeParametersIntermediate({
        types,
        params
      })
      op.lines.should.eql(expected)
    })
  })

  it('encodeParameters', () => {
    let {encodeParameters} = abi
    cases.forEach(({types, params, expected}) => {
      let op = encodeParameters(types, params)
      op.should.eql('0x' + expected.join(''))
    })
  })

  it('encodeParameter', () => {
    let {encodeParameter} = abi
    let type = 'int'
    let param = 0xffffff
    encodeParameter(type, param).should.eql(
      '0x00000000000000000000000000ffffff'
    )
    type = 'bool[3]'
    param = [false, true, false]
    encodeParameter(type, param).should.eql(
      '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000'
    )
  })

  it('decodeParameters', () => {
    let {encodeParameters, decodeParameters} = abi
    cases.forEach(({types, params}) => {
      let encoded = encodeParameters(types, params)
      let decoded = decodeParameters(types, encoded)
      decoded.should.eql(params)
    })
  })
})
