let {Buffer} = require('safe-buffer')
let {isBuffer} = Buffer
let assert = require('assert')
let should = require('should')
let Accounts = require('../../src/accounts')
let {equalAddresses, isPrivateKey} = require('../../src/lib/accounts')
let values = require('../../src/lib/values')
let {testProvider} = require('./fixtures')

// aion-specific rlp fork
let rlp = require('rlp');
let {AionLong} = rlp;
let BN = require('bn.js');

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
      res.aionPubSig.should.be.a.String
      res.rawTransaction.should.be.a.String

      res.messageHash.startsWith('0x').should.be.exactly(true)
      res.signature.startsWith('0x').should.be.exactly(true)
      res.aionPubSig.startsWith('0x').should.be.exactly(true)
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

  // should read from signedTransaction.aionPubSig instead of signedTransaction.signature
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

  it('encrypt (scrypt, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'scrypt'
    })
    keystore.version.should.be.exactly(3)
  })

  it('encrypt (pbkdf2, slow)', () => {
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

  it('decrypt (scrypt, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'scrypt'
    })
    let decryptedAccount = accounts.decrypt(keystore, password, true)
    assert.equal(account.address, decryptedAccount.address)
    assert.equal(account.password, decryptedAccount.password);
    assert.equal(account.publicKey.toString('hex'), decryptedAccount.publicKey.toString('hex'));
    assert.equal(account.privateKey.toString('hex'), decryptedAccount.privateKey.toString('hex'));
  })

  it('decrypt (pbkdf2, slow)', () => {
    let account = accounts.create()
    let keystore = accounts.encrypt(account.privateKey, password, {
      kdf: 'pbkdf2'
    })
    let decryptedAccount = accounts.decrypt(keystore, password, true)
    assert.equal(account.address, decryptedAccount.address)
    assert.equal(account.password, decryptedAccount.password);
    assert.equal(account.publicKey.toString('hex'), decryptedAccount.publicKey.toString('hex'));
    assert.equal(account.privateKey.toString('hex'), decryptedAccount.privateKey.toString('hex'));
  })


/*

  ported from:
  https://github.com/aionnetwork/aion/blob/tx_encoding_tests/modAion/test/org/aion/types/AionTransactionIntegrationTest.java

*/

  it('basicEncodingTest', done => {

    // Reference Data [AionTransactionIntegrationTest.java]
    let obj = JSON.parse(`{
        "privateKey": "ab5e32b3180abc5251420aecf1cd4ed5f6014757dbdcf595d5ddf907a43ebd4af2d9cac934c028a26a681fe2127d0b602496834d7cfddd0db8a7a45079428525",
      "tx": {
        "nrgPrice": 10000000000,
        "nrg": 1000000,
        "data": "a035872d6af8639ede962dfe7536b0c150b590f3234a922fb7064cd11971b58e",
        "to": "9aabf5b86690ca4cae3fada8c72b280c4b9302dd8dd5e17bd788f241d7e3045c",
        "type": 1,
        "nonce": "01",
        "value": "01",
        "timestamp": "00057380e1f5330b"
      },
      "ed_sig": "6b00ed09ecc49814092b498d49c49f23cdfa71746b2723696b04ce601e87f5a3858e68c7f7e69f913f7e0b303e16b5fc3fa92829e24d6085a45092f5118b140a",
      "raw": "f85b01a09aabf5b86690ca4cae3fada8c72b280c4b9302dd8dd5e17bd788f241d7e3045c01a0a035872d6af8639ede962dfe7536b0c150b590f3234a922fb7064cd11971b58e8800057380e1f5330b830f42408800000002540be40001",
      "signed": "f8bd01a09aabf5b86690ca4cae3fada8c72b280c4b9302dd8dd5e17bd788f241d7e3045c01a0a035872d6af8639ede962dfe7536b0c150b590f3234a922fb7064cd11971b58e8800057380e1f5330b830f42408800000002540be40001b860f2d9cac934c028a26a681fe2127d0b602496834d7cfddd0db8a7a450794285256b00ed09ecc49814092b498d49c49f23cdfa71746b2723696b04ce601e87f5a3858e68c7f7e69f913f7e0b303e16b5fc3fa92829e24d6085a45092f5118b140a",
      "aion_sig": "f2d9cac934c028a26a681fe2127d0b602496834d7cfddd0db8a7a450794285256b00ed09ecc49814092b498d49c49f23cdfa71746b2723696b04ce601e87f5a3858e68c7f7e69f913f7e0b303e16b5fc3fa92829e24d6085a45092f5118b140a"
    }`);

    // Generate new account with privateKey
    let privateKey = Buffer.from(obj.privateKey, 'hex');
    let account = accounts.privateKeyToAccount(privateKey);
    signedTransactionAccount = account.address;
    // console.log(isPrivateKey(privateKey));
    // console.log(isBuffer(privateKey));

    // Modify parameter inputs as Buffer type
    tx = obj.tx;
    tx.nonce = Buffer.from(obj.tx.nonce, 'hex');
    tx.to = Buffer.from(obj.tx.to, 'hex');
    tx.value = Buffer.from(obj.tx.value, 'hex');
    tx.data = Buffer.from(obj.tx.data, 'hex');
    tx.timestamp = Buffer.from(obj.tx.timestamp, 'hex');
    tx.type = Buffer.alloc(1).writeUInt8(obj.tx.type, 0);
    tx.gasPrice = obj.tx.nrgPrice;
    tx.gas = obj.tx.nrg;

    let temp = account.signTransaction(tx, (err, res) => {
      if (err !== null && err !== undefined) {
        console.error('error signTransaction', err)
        return done(err)
      }
      signedTransaction = res
      done()
    })

    // console.log('address: ', account.address.toLowerCase());
    // console.log('privateKey: ', account.privateKey.toString('ascii'));
    // console.log('publicKey: ', account.publicKey.toString('ascii'));

    // console.log(signedTransaction);
    assert.equal(signedTransaction.encoded, obj.raw);           // encode of rlp
    assert.equal(signedTransaction.signature, obj.ed_sig);      // signature
    assert.equal(signedTransaction.aionPubSig, obj.aion_sig);   // aion signature
    assert.equal(signedTransaction.rawTransaction, obj.signed); // signed hash

  })

/*

  Ported from:
  https://github.com/aionnetwork/aion/blob/master/modMcf/src/org/aion/mcf/account/KeystoreItem.java

*/
  it('serialize & deserialize ksv3', () => {

    // Test with ksv3 object from Aion
    // let privateKey = Buffer.from("13d56ce1caf9c34bb6993880785c67e2bdc8457e51d796ca8d3505f76c404625243b1c695f19af1c43cac38faa995b38c939e2e4124f2224d1ec77d100696bd7", 'hex');
    // let account1 = accounts.privateKeyToAccount(privateKey);
    // let ksv3 = JSON.parse(`{
    //   "address": "a060b99f02c921a7c4ba8656212b34d65d6d466801d709d3c455dab0fa37194e",
    //   "id": "26c61c69-8323-4640-87ef-46795fa46198",
    //   "version": 3,
    //   "crypto": {
    //     "cipher": "aes-128-ctr",
    //     "ciphertext": "e5f281387e2c75cf4f64c200135750e876cebb6759a38058bbba6a58a1387f85df74671167039a91b9acbf00f7cb3a60889b5906b762c336a48e263082deb242",
    //     "kdfparams": {
    //       "p": 1,
    //       "r": 8,
    //       "salt": "a7d691085ba0667b650b39d6134ad2835296f0058e3acd58037c6aed24ce0bbd",
    //       "dklen": 32,
    //       "n": 262144
    //     },
    //     "cipherparams": {"iv": "24baab0e78c5261de35fd0f6c8053481"},
    //     "kdf": "scrypt",
    //     "mac": "d5dbc47fabc8494da6aee925e3d4047a983c14f377375f5b5d16100e4c0b3e8e"
    //   }
    // }`);

    // Generating a new account from privateKey
    let account1 = accounts.create();
    // console.log('1: password:       ', password);
    // console.log('1: privateKey:     ', account1.privateKey.toString('hex'));
    // console.log('1: publicKey:      ', account1.publicKey.toString('hex'));

    let ksv3 = accounts.encrypt(account1.privateKey, password)
    let serializedKey = accounts.toRlp(ksv3);
    // console.log('1: keystore:       ', ksv3);
    // console.log('X: serializedKey:  ', serializedKey.toString('hex'));

    // Deserialize into account
    let keystore = accounts.fromRlp(serializedKey);
    // console.log('2: keystorev3      ', keystore);
    assert.equal(ksv3.id, keystore.id);
    assert.equal(ksv3.address, keystore.address);
    assert.equal(ksv3.crypto.ciphertext, keystore.crypto.ciphertext);
    assert.equal(ksv3.crypto.cipherparams.iv, keystore.crypto.cipherparams.iv);
    assert.equal(ksv3.crypto.salt, keystore.crypto.salt);
    assert.equal(ksv3.crypto.mac, keystore.crypto.mac);

    let account2 = accounts.decrypt(keystore, password, true)
    // console.log('2: password:       ', password);
    // console.log('2: privateKey:     ', account2.privateKey.toString('hex'));
    // console.log('2: publicKey:      ', account2.publicKey.toString('hex'));
    assert.equal(account1.privateKey.toString('hex'), account2.privateKey.toString('hex'));
    assert.equal(account1.publicKey.toString('hex'), account2.publicKey.toString('hex'));
  })

});
