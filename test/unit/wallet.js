let Accounts = require('../../src/accounts')
let {createPrivateKey} = require('../../src/lib/accounts')

describe('Wallet', () => {
  let accounts
  let wallet
  let keystores

  it('intializes', () => {
    accounts = new Accounts()
    wallet = accounts.wallet
  })

  it('create', () => {
    wallet.create(3)
    wallet.should.have.length(3)
  })

  it('add', () => {
    wallet.add(createPrivateKey())
    wallet.should.have.length(4)
  })

  it('encrypt', () => {
    keystores = wallet.encrypt()
  })

  it('decrypt', () => {
    wallet.decrypt(keystores)
  })

  it('load', () => {
    should.throws(() => wallet.load())
  })

  it('save', () => {
    should.throws(() => wallet.save())
  })

  it('remove', () => {
    let addr
    Object.keys(wallet).forEach(key => {
      if (key.length > 30) {
        addr = key
      }
    })
    wallet.remove(addr).should.be.exactly(true)
    wallet.should.have.length(3)
  })

  it('clear', () => {
    wallet.clear()
    wallet.should.have.length(0)
  })
})
