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

  // connects to a node
  xit('signTransaction (slow)', done => {
    let account = accounts.create()
    let tx = {
      gas: '50000',
      gasLimit: '60000',
      to: account.address,
      from: account.address,
      value: '70000',
      data: 'test'
    }
    account.signTransaction(tx, (err, res) => {
      if (err !== null && err !== undefined) {
        /* eslint-disable no-console */
        console.error('error signTransaction', err)
        /* eslint-enable no-console */
        return done(err)
      }

      res.messageHash.should.be.a.String
      assert.equal(isBuffer(res.rawTransaction), true)
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
    let account = accounts.create()
    let signed = account.sign(msg, account.privateKey)
    let recovery = accounts.recover(signed)
    assert.equal(equalAddresses(account.address, recovery), true)
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
