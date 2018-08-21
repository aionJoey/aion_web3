/**
 * @module Accounts
 */

let numberToBn = require('number-to-bn')
let parallel = require('async/parallel')
let get = require('lodash/get')
let uuidv4 = require('uuid/v4')
let {isFunction, isObject, find} = require('underscore')
let BN = require('bn.js')

// aion-specific rlp fork
let rlp = require('rlp')
let {AionLong} = rlp

let {assignExtend} = require('./extend')
let {assignProvider} = require('./providers')

let {isPrivateKey, createA0Address, createKeyPair} = require('./lib/accounts')

let {hexToNumber, bytesToHex} = require('./utils')

let crypto = require('./lib/crypto')
let {keccak256, blake2b256, nacl, scrypt} = crypto

let {
  toBuffer,
  equalBuffers,
  randomHexBuffer,
  removeLeadingZeroX
} = require('./lib/formats')

let values = require('./lib/values')
let Wallet = require('./wallet')

let {inputAddressFormatter, inputBlockNumberFormatter} = require('./formatters')

let methods = [
  {
    name: 'getId',
    call: 'net_version',
    params: 0,
    outputFormatter: hexToNumber
  },
  {
    name: 'getGasPrice',
    call: 'eth_gasPrice',
    params: 0,
    outputFormatter: hexToNumber
  },
  {
    name: 'getTransactionCount',
    call: 'eth_getTransactionCount',
    params: 2,
    inputFormatter: [inputAddressFormatter, inputBlockNumberFormatter],
    outputFormatter: hexToNumber
  }
]

// address + message signature length
let aionPubSigLen = nacl.sign.publicKeyLength + nacl.sign.signatureLength

/**
 * Aion transaction timestamp
 * @returns {number}
 */
let getTimestamp = () => Math.floor(Date.now() / 1000)

/**
 * RLP long type for Java
 * @method
 * @param {number} val
 * @returns {object}
 */
let toLong = val => new AionLong(new BN(val))

/**
 * Account constructor
 * @param {object} options
 * @param {object} options.accounts
 * @param {string} options.address
 * @param {buffer} options.entropy
 * @param {buffer} options.privateKey
 * @returns {object}
 */
function Account({accounts, entropy, privateKey}) {
  if (accounts === undefined) {
    throw new Error(
      'an accounts instance is necessary to instantiate an account'
    )
  }

  this._accounts = accounts
  this._seed = null
  this.privateKey = null

  let keyPair = createKeyPair({entropy, privateKey})
  this.publicKey = keyPair.publicKey
  this.privateKey = keyPair.privateKey

  this.address = createA0Address(this.publicKey)
}

Account.prototype.signTransaction = function(tx, done) {
  let {privateKey} = this
  return this._accounts.signTransactionWithKey(tx, privateKey, done)
}

Account.prototype.sign = function(message) {
  let {privateKey} = this
  return this._accounts.sign(message, privateKey)
}

Account.prototype.encrypt = function(password, options) {
  let {privateKey} = this
  return this._accounts.encrypt(privateKey, password, options)
}

/**
 * Accounts constructor
 * @constructor Accounts
 * @param {object} provider
 * @param {object} providerOpts options
 */
function Accounts(provider, providerOpts) {
  assignProvider(this, {provider, providerOpts})
  assignExtend(this, {methods})
  this.wallet = new Wallet(this)
}

/*

Accounts instance members

*/

/**
 * Create Account using randomized data
 * @instance
 * @method create
 * @param {object} entropy hex buffer or string
 * @return {object}
 */
Accounts.prototype.create = function(entropy) {
  let accounts = this
  let account = new Account({accounts, entropy})

  // it could automatically add into the wallet
  // this.wallet.add(account)
  return account
}

Accounts.prototype._findAccountByPrivateKey = function(privateKey) {
  return find(this.wallet, item => {
    let itemPrivateKey = get(item, 'privateKey')
    if (itemPrivateKey === undefined) {
      return false
    }
    return equalBuffers(privateKey, itemPrivateKey) === true
  })
}

Accounts.prototype._findAccountByPublicKey = function(publicKey) {
  return find(this.wallet, item => {
    let itemPublicKey = get(item, 'publicKey')
    if (itemPublicKey === undefined) {
      return false
    }
    return equalBuffers(publicKey, itemPublicKey) === true
  })
}

Accounts.prototype._findAccountByAddress = function(address) {
  return find(this.wallet, item => {
    let itemAddress = get(item, 'address')
    if (itemAddress === undefined) {
      return false
    }
    return address === itemAddress
  })
}

/**
 * Get an account by providing a private key
 * @instance
 * @method privateKeyToAccount
 * @param {object} privateKey hex buffer or string
 * @return {object}
 */
Accounts.prototype.privateKeyToAccount = function(privateKey) {
  let accounts = this
  let account =
    this._findAccountByPrivateKey(privateKey) ||
    new Account({accounts, privateKey})
  this.wallet.add(account)
  return account
}

/**
 * Sign a transaction object with a private key.
 *
 * The timestamp is specific to Aion. It's calculated automatically
 * from `Math.floor(Date.now() / 1000)`.
 *
 * @instance
 * @method signTransaction
 * @param {object} tx
 * @param {buffer} [tx.nonce]
 * @param {buffer} [tx.to]
 * @param {buffer} [tx.value]
 * @param {buffer} [tx.data]
 * @param {buffer} [tx.timestamp]
 * @param {number} [tx.gas] nrg in aion terms
 * @param {number} [tx.gasPrice] nrg price
 * @param {buffer} [tx.type] defaults to 0x01, for future use
 * @param {buffer} privateKey
 * @param {function} done
 * @returns {object} promise
 */
Accounts.prototype.signTransactionWithKey = function(tx, privateKey, done) {

  function signTransactionFailed(err) {
    if (isFunction(done) === true) {
      return done(err)
    }
    return Promise.reject(err)
  }

  if (tx === undefined) {
    return signTransactionFailed(new Error('no transaction was provided'))
  }

  if (isPrivateKey(privateKey) === false) {
    return signTransactionFailed(new Error('the private key was invalid'))
  }

  if (tx.gas === undefined) {
    return signTransactionFailed(new Error('tx.gas is required'))
  }

  if (tx.chainId !== undefined) {
    return signTransactionFailed(
      new Error(`
      Aion doesn't have a chainId you can pass.
    `)
    )
  }

  let steps = {}
  let {address, publicKey} = this.privateKeyToAccount(privateKey) // keys are always inconsistent
  let transaction = Object.assign({}, tx)
  // console.log('privateKey', privateKey);

  if (transaction.gasPrice === undefined) {
    // get gas price
    steps.gasPrice = done => this.getGasPrice(done)
  }

  if (transaction.nonce === undefined) {
    // get transaction count to use as nonce
    steps.nonce = done => this.getTransactionCount(address, 'latest', done)
  }

  // Added timestamp check
  if (transaction.timestamp === undefined) {
    timestamp = getTimestamp();
  }

  // Added type check
  if (transaction.type === undefined) {
    type = 1;
  }

  function sign(res) {
    // apply missing requested valued over the tx
    transaction = Object.assign({}, transaction, res)
    // transaction = inputCallFormatter(transaction)

    // how to use gasLimit?
    let {
      nonce,
      to,
      value,
      data,
      timestamp,    // = getTimestamp();
      gas,
      gasPrice,
      type          // =1;
    } = transaction

    /*

    Ethereum:

    -----------------------------
    | Nonce    | Up to 32 bytes |
    -----------------------------
    | GasPrice | Up to 32 bytes |
    -----------------------------
    | GasLimit | Up to 32 bytes |
    -----------------------------
    | To       | 20 bytes addr  |
    -----------------------------
    | Value    | Up to 32 bytes |
    -----------------------------
    | Data     | 0 - unlimited  |
    -----------------------------
    | V        | 1 (usually)    |
    -----------------------------
    | R        | 32 bytes       |
    -----------------------------
    | S        | 32 bytes       |
    -----------------------------

    Aion:

    RLP_TX_NONCE = 0
    RLP_TX_TO = 1
    RLP_TX_VALUE = 2
    RLP_TX_DATA = 3
    RLP_TX_TIMESTAMP = 4
    RLP_TX_NRG = 5
    RLP_TX_NRGPRICE = 6
    RLP_TX_TYPE = 7
    RLP_TX_SIG = 8

    */

    // Equivalent values in AION:
    // AION: [nrg] & [nrgPrice]
    // Web3: [gas] & [gasPrice]

    let rlpValues = [
      nonce,
      to,
      value,
      data,
      timestamp,
      toLong(gas),
      toLong(gasPrice),
      toLong(type)
    ]

    // Equivalent values in AION:
    // AION: [rlp]       --encode--> [raw]     --sign--> [ed_sig]    + [aion_sig]   --encode--> [signed]
    // Web3: [rlpValues] --encode--> [encoded] --sign--> [signature] + [aionPubSig] --encode--> [rawTransaction]
    // https://github.com/aionnetwork/aion/blob/tx_encoding_tests/modAion/test/org/aion/types/AionTransactionIntegrationTest.java

    // Aion-specific RLP encode
    let encoded = rlp.encode(rlpValues)

    // sign (should hash at the start)
    let signature = toBuffer(nacl.sign.detached(blake2b256(encoded), privateKey))

    // verify (should hash at the start)
    if (nacl.sign.detached.verify(blake2b256(encoded), signature, publicKey) === false) {
      throw new Error(`
      Could not verify signature.
      address: ${address},
      publicKey: ${publicKey.toString('hex')}
      message: ${encoded}
    `)
    }

    // aion-specific signature scheme
    let aionPubSig = Buffer.concat([publicKey, signature], aionPubSigLen)

    // decode and add signature
    let rawTx = rlp.decode(encoded)
    rawTx.push(toBuffer(aionPubSig))

    // re-encode
    let rawTransaction = rlp.encode(rawTx)

    // hash (shouldn't hash at the end)
    let messageHash = bytesToHex(rawTransaction)

    // messageHash and rawTransaction does the same thing?
    encoded = bytesToHex(encoded);
    signature = bytesToHex(aionPubSig);
    aionPubSig = bytesToHex(aionPubSig);
    rawTransaction = bytesToHex(rawTransaction);

    return {
      encoded,
      signature,
      aionPubSig,
      rawTransaction,
      messageHash
    }
  }

  // callback
  if (isFunction(done) === true) {
    parallel(steps, (err, res) => {
      if (err !== undefined && err !== null) {
        return done(err)
      }

      let op = sign(res)
      done(null, op)
    })
    return
  }

  // Promise
  return new Promise((resolve, reject) => {
    parallel(steps, (err, res) => {
      if (err !== undefined && err !== null) {
        return reject(err)
      }

      let op = sign(res)
      resolve(op)
    })
  })
}

/**
 * Given a signature it will recover the Aion address.
 * @instance
 * @method recoverTransaction
 * @param {string} rawTx
 * @returns {string}
 */
Accounts.prototype.recoverTransaction = function(rawTx) {
  return this.recover(null, rlp.decode(rawTx).pop())
}

/**
 * Hashed Aion signed message with preamble
 * @instance
 * @method hashMessage
 * @param {string} message
 * @return {buffer} blake2b256 hash
 */
Accounts.prototype.hashMessage = function(message) {
  let messageBuffer = toBuffer(message)
  let len = messageBuffer.length
  let preamble = `\x19Aion Signed Message:\n${len}`
  let preambleBuffer = toBuffer(preamble)
  return blake2b256(Buffer.concat([preambleBuffer, messageBuffer]))
}

/**
 * Sign the message with account address and message signature
 * @instance
 * @method sign
 * @param {string} message
 * @param {buffer} privateKey
 * @return {object} contains message, messageHash, signature
 */
Accounts.prototype.sign = function(message, privateKey) {
  let account = this.privateKeyToAccount(privateKey)
  let {address, publicKey} = account
  let messageHash = blake2b256(toBuffer(message))
  let signature = toBuffer(nacl.sign.detached(messageHash, privateKey))

  if (nacl.sign.detached.verify(messageHash, signature, publicKey) === false) {
    throw new Error(`
      Could not verify signature.
      address: ${address},
      publicKey: ${publicKey.toString('hex')}
      message: ${message}
    `)
  }

  // address + message signature
  let aionPubSig = Buffer.concat(
    [publicKey, toBuffer(signature)],
    aionPubSigLen
  )

  aionPubSig = bytesToHex(aionPubSig)
  messageHash = bytesToHex(messageHash)

  return {
    message,
    messageHash: messageHash,
    signature: aionPubSig
  }
}

/**
 * The Aion address is the first 64 bytes of the signature
 * @instance
 * @method recover
 * @param {object|string} message
 * @param {string|buffer} signature
 * @return {string} the signing address
 */
Accounts.prototype.recover = function(message, signature) {
  let publicKey = toBuffer(signature || message.signature).slice(0, 32)
  return createA0Address(publicKey)
}

/**
 * Encrypt an account to keystore v3 format
 * @instance
 * @method encrypt
 * @param {buffer} privateKey
 * @param {string|Buffer} password
 * @param {object} options
 * @param {string} options.kdf pbkdf2 or scrypt
 * @param {buffer} [options.salt]
 * @param {buffer} [options.iv] initialization vector
 * @param {number} [options.dklen] key length bytes
 * @param {number} [options.c] pbkdf2 c variable
 * @param {number} [options.n] scrypt n variable
 * @param {number} [options.r] scrypt r variable
 * @param {number} [options.p] scrypt p variable
 * @param {function} [options.scryptProgress] arguments (current, total, percent)
 * @param {number} [options.cipher] algorithm
 * @param {number} [options.uuid] random bytes for id
 * @return {object}
 */
Accounts.prototype.encrypt = function(privateKey, password, options = {}) {
  if (privateKey === undefined) {
    throw new Error(`missing private key`)
  }

  if (password === undefined) {
    throw new Error(`missing password`)
  }

  let account = this.privateKeyToAccount(privateKey)
  let address = removeLeadingZeroX(account.address.toLowerCase())

  let {
    salt = randomHexBuffer(values.crypto.saltLength),
    iv = randomHexBuffer(values.crypto.ivLength),
    kdf = values.crypto.kdf,
    dklen = values.crypto.dklen
  } = options

  iv = toBuffer(iv)
  let pwBuf = toBuffer(password)
  let saltBuf = toBuffer(salt)
  salt = salt.toString('hex')

  let derivedKey
  let kdfparams = {dklen, salt}

  if (kdf === 'pbkdf2') {
    let {c = values.crypto.pbkdf2.c} = options
    let digest = values.crypto.pbkdf2.digest

    kdfparams.c = c

    // this values doesn't do anything
    // it just goes into the return object kdfparams
    kdfparams.prf = values.crypto.pbkdf2.prf

    derivedKey = crypto.node.pbkdf2Sync(pwBuf, saltBuf, c, dklen, digest)
  }

  if (kdf === 'scrypt') {
    let {
      n = values.crypto.scrypt.n,
      r = values.crypto.scrypt.r,
      p = values.crypto.scrypt.p
    } = options
    kdfparams.n = n
    kdfparams.r = r
    kdfparams.p = p
    let scryptArgs = [pwBuf, saltBuf, n, r, p, dklen]
    if (isFunction(options.scryptProgress) === true) {
      scryptArgs.push(options.scryptProgress)
    }
    derivedKey = scrypt.apply(null, scryptArgs)
  }

  if (derivedKey === undefined) {
    throw new Error('Unsupported kdf')
  }

  let algorithm = options.cipher || values.crypto.cipherIvAlgorithm
  let keyStart = derivedKey.slice(0, 16)
  let keyEnd = derivedKey.slice(16, 32)
  let cipher = crypto.node.createCipheriv(algorithm, keyStart, iv)

  if (cipher === undefined) {
    throw new Error('Unsupported cipher')
  }

  let cipherBuf = Buffer.concat([cipher.update(privateKey), cipher.final()])
  let ciphertext = cipherBuf.toString('hex')

  // should use blake2b256
  // let mac = keccak256(Buffer.concat([keyEnd, cipherBuf])).toString('hex')
  let mac = blake2b256(Buffer.concat([keyEnd, cipherBuf])).toString('hex')
  let version = 3
  let {uuid = crypto.node.randomBytes(values.crypto.uuidRandomBytes)} = options
  let id = uuidv4({random: uuid})
  let cipherparams = {iv: iv.toString('hex')}

  return {
    version,
    id,
    address,
    crypto: {
      ciphertext,
      cipherparams,
      cipher: algorithm,
      kdf,
      kdfparams,
      mac
    }
  }
}

/**
 * Decrypt the keystorev3 object
 * @instance
 * @method decrypt
 * @param {object} ksv3
 * @param {string} password
 * @param {boolean} nonStrict
 * @returns {object} account
 */
Accounts.prototype.decrypt = function(ksv3, password, nonStrict) {
  if (password === undefined) {
    throw new Error('No password given.')
  }

  let keystore =
    isObject(ksv3) === true
      ? ksv3
      : JSON.parse(nonStrict === true ? ksv3.toLowerCase() : ksv3)

  if (keystore.version !== 3) {
    throw new Error('not a valid keystore v3 object')
  }

  let derivedKey
  let {kdf, cipherparams} = keystore.crypto
  let algorithm = keystore.crypto.cipher
  let {kdfparams, ciphertext} = keystore.crypto
  let {salt, dklen} = kdfparams
  let pwBuf = toBuffer(password)
  let saltBuf = toBuffer(salt)
  let cipherBuf = toBuffer(ciphertext)

  if (kdf === 'scrypt') {
    // scrypt-specific params
    let {n, r, p} = kdfparams
    derivedKey = crypto.scrypt(pwBuf, saltBuf, n, r, p, dklen)
  }

  if (kdf === 'pbkdf2') {
    // pbkdf2-specific params
    let {c} = kdfparams
    let digest = values.crypto.pbkdf2.digest
    derivedKey = crypto.node.pbkdf2Sync(pwBuf, saltBuf, c, dklen, digest)
  }

  if (derivedKey === undefined) {
    throw new Error('Unsupported key derivation scheme')
  }

  let keyStart = derivedKey.slice(0, 16)
  let keyEnd = derivedKey.slice(16, 32)

  // MAC DECRYPT INCORRECT (should use blake2b256)
  // let mac = keccak256(Buffer.concat([keyEnd, cipherBuf]))
  let mac = blake2b256(Buffer.concat([keyEnd, cipherBuf]))

  if (mac !== keystore.crypto.mac) {
    throw new Error(`
      The mac hash failed. This indicates password could be wrong.
      keystore mac: ${keystore.crypto.mac}
      calculated mac: ${mac}
    `)
  }

  // initialization vector
  let iv = toBuffer(cipherparams.iv)
  let decipher = crypto.node.createDecipheriv(algorithm, keyStart, iv)
  let privateKey = Buffer.concat([decipher.update(cipherBuf), decipher.final()])

  return this.privateKeyToAccount(privateKey)
}

/**
 * Serializes ksv3 object into buffer
 * https://github.com/aionnetwork/aion/blob/tx_encoding_tests/modMcf/src/org/aion/mcf/account/KeystoreItem.java
 *
 * @method toRlpKey
 * @param {object} ksv3
 * @return {buffer} Keystore (byte)
 */
 Accounts.prototype.toRlp = function(ksv3) {

    var kdfparams=[];
    kdfparams[0] = "";
    kdfparams[1] = ksv3.crypto.kdfparams.dklen;
    kdfparams[2] = ksv3.crypto.kdfparams.n;
    kdfparams[3] = ksv3.crypto.kdfparams.p;
    kdfparams[4] = ksv3.crypto.kdfparams.r;
    kdfparams[5] = ksv3.crypto.kdfparams.salt.toString('hex');
    var Kdfparams = rlp.encode(kdfparams);

    var cipherparams=[];
    cipherparams[0] = ksv3.crypto.cipherparams.iv.toString('hex');
    var Cipherparams = rlp.encode(cipherparams);

    var crypto=[];
    crypto[0] = 'aes-128-ctr';
    crypto[1] = ksv3.crypto.ciphertext.toString('hex');
    crypto[2] = "scrypt";
    crypto[3] = ksv3.crypto.mac;
    crypto[4] = Cipherparams;
    crypto[5] = Kdfparams;
    var Crypto = rlp.encode(crypto);

    var keystore = [];
    keystore[0] = ksv3.id;
    keystore[1] = 3;
    keystore[2] = ksv3.address;
    keystore[3] = Crypto;
    var Keystore = rlp.encode(keystore);

    return Keystore;
}

module.exports = Accounts
