let abi = require('../../src/abi')

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

  xit('encodeParameter', () => {
    abi
      .encodeParameter('uint128', '2345675643')
      .should.be.exactly('0x0000000000000000000000008bd02b7b')
    abi
      .encodeParameter('uint64', '2345675643')
      .should.be.exactly('0x0000000000000000000000008bd02b7b')
    abi
      .encodeParameter('bytes32', '0xdf3234')
      .should.be.exactly('0xdf32340000000000000000000000000000')
    abi
      .encodeParameter('bytes', '0xdf3234')
      .should.be.exactly(
        '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003df32340000000000000000000000000000000000000000000000000000000000'
      )
    abi
      .encodeParameter('bytes32[]', ['0xdf3234', '0xfdfd'])
      .should.be.exactly(
        '00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002df32340000000000000000000000000000000000000000000000000000000000fdfd000000000000000000000000000000000000000000000000000000000000'
      )
  })
})
