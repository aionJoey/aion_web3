let Contract = require('../../src/contract')

describe('Contract', () => {
  let contract

  it('initializes', () => {
    contract = new Contract()
    contract.options.should.be.an.Object
  })
})
