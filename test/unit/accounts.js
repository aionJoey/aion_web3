let {Buffer} = require('safe-buffer')
let {isBuffer} = Buffer
let assert = require('assert')
let Accounts = require('../../src/accounts')
let {equalAddresses} = require('../../src/lib/accounts')
let values = require('../../src/lib/values')
let {testProvider} = require('./fixtures')

let msg = 'test message'
let password = 'test password'

describe('Accounts', () => {
  let accounts
  let signedTransactionAccount
  let signedTransaction

  it('initializes', () => {
    accounts = new Accounts(testProvider)
  })

  it('create', () => {
    let account = accounts.create()
    account.address.should.be.a.String
    account.address.startsWith(values.zeroX).should.be.exactly(true)
    assert(isBuffer(account.privateKey))
    account.signTransaction.should.be.a.Function
    account.sign.should.be.a.Function
    account.encrypt.should.be.a.Function
  })

  it('signTransaction', done => {
    let account = accounts.create()

    // for recovery below
    signedTransactionAccount = account.address

    let tx = {
      gas: 50000,
      gasLimit: 60000,
      gasPrice: 80000,
      to: account.address,
      from: account.address,
      value: 90000,
      data: 'test',
      nonce: 0
    }
    account.signTransaction(tx, (err, res) => {
      // console.log('err', err)
      // console.log('res', res)

      if (err !== null && err !== undefined) {
        /* eslint-disable no-console */
        console.error('error signTransaction', err)
        /* eslint-enable no-console */
        return done(err)
      }

      res.messageHash.should.be.a.String
      res.signature.should.be.a.String
      res.rawTransaction.should.be.a.String

      res.messageHash.startsWith('0x').should.be.exactly(true)
      res.signature.startsWith('0x').should.be.exactly(true)
      res.rawTransaction.startsWith('0x').should.be.exactly(true)

      signedTransaction = res

      done()
    })
  })

  it('hashMessage', () => {
    accounts.hashMessage('test').should.be.a.String
  })

  it('sign', () => {
    let account = accounts.create()
    let signed = account.sign(msg, account.privateKey)
    signed.message.should.be.exactly(msg)
    signed.messageHash.should.be.a.String
    signed.messageHash.should.be.a.String
    signed.signature.should.be.a.String
  })

  it('recover', () => {
    // from above signTransaction
    accounts
      .recover(signedTransaction)
      .should.be.exactly(signedTransactionAccount)

    // and another from signing a message
    let account = accounts.create()
    let {address, privateKey} = account
    let signed = account.sign(msg, privateKey)
    let recovery = accounts.recover(signed)
    assert.equal(equalAddresses(address, recovery), true)
  })

  it('recoverTransaction', () => {
    accounts
      .recoverTransaction(signedTransaction.rawTransaction)
      .should.be.exactly(signedTransactionAccount)
  })

  xit('encrypt (scrypt, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'scrypt'
    })
    keystore.version.should.be.exactly(3)
  })

  xit('encrypt (pbkdf2, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'pbkdf2'
    })
    keystore.version.should.be.exactly(3)
    keystore.address.should.be.a.String
    keystore.address.should.have.length(64)
    keystore.crypto.ciphertext.should.be.a.String
    keystore.crypto.cipherparams.iv.should.be.a.String
    keystore.crypto.cipher.should.be.a.String
    keystore.crypto.kdf.should.be.exactly('pbkdf2')
    keystore.crypto.kdfparams.should.be.an.Object
    keystore.crypto.mac.should.be.a.String
  })

  xit('decrypt (scrypt, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'scrypt'
    })
    let decryptedAccount = accounts.decrypt(keystore, password)
    assert.equal(account.address, decryptedAccount.address)
  })

  xit('decrypt (pbkdf2, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'pbkdf2'
    })
    let decryptedAccount = accounts.decrypt(keystore, password)
    assert.equal(account.address, decryptedAccount.address)
  })
})
