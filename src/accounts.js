let parallel = require('async/parallel')
let get = require('lodash/get')
let uuidv4 = require('uuid/v4')
let {isFunction, isObject, find} = require('underscore')
let rlp = require('rlp')

let {assignExtend} = require('./extend')
let {assignProvider} = require('./providers')

let {
  isPrivateKey,
  createA0Address,
  createA0AddressString,
  isAccountAddress,
  createPrivateKey
} = require('./lib/accounts')

let {hexToNumber, bytesToHex} = require('./utils')
let crypto = require('./lib/crypto')
let {keccak256, nacl, scrypt} = crypto
let {validateTransaction} = require('./lib/transactions')

let {
  toBuffer,
  equalBuffers,
  randomHexBuffer,
  removeLeadingZeroX
} = require('./lib/formats')

let values = require('./lib/values')
let Wallet = require('./wallet')

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
    params: 0
  },
  {
    name: 'getTransactionCount',
    call: 'eth_getTransactionCount',
    params: 2,
    inputFormatter: [
      function(address) {
        if (isAccountAddress(address) === true) {
          return address
        } else {
          throw new Error(
            'Address ' +
              address +
              ' is not a valid address to get the "transactionCount".'
          )
        }
      },
      function() {
        return 'latest'
      }
    ]
  }
]

let signTransactionDefaults = {
  chainId: values.nat.one,
  to: values.zeroX,
  data: values.zeroX,
  value: values.zeroX
}

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

  // held internally to access accounts functions
  this._accounts = accounts

  // key generation entropy
  let ent = (entropy !== undefined && toBuffer(entropy)) || randomHexBuffer()

  this.privateKey =
    (privateKey !== undefined && toBuffer(privateKey)) || createPrivateKey(ent)

  let kp = nacl.sign.keyPair.fromSeed(
    this.privateKey.slice(0, nacl.sign.seedLength)
  )

  this._nacl = {
    publicKey: toBuffer(kp.publicKey),
    secretKey: toBuffer(kp.secretKey)
  }

  // held so we don't have to recompute
  this._addressBuffer = null

  // 0xAO address
  this.address = null
  this._addressBuffer = createA0Address(this._nacl.publicKey)
  this.address = createA0AddressString(this._addressBuffer)
}

Account.prototype.signTransaction = function(tx, done) {
  let {privateKey} = this
  return this._accounts.signTransaction(tx, privateKey, done)
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

Accounts.prototype._findAccountByPk = function(privateKey) {
  return find(this.wallet, item => {
    let itemPrivateKey = get(item, 'privateKey')
    if (itemPrivateKey === undefined) {
      return false
    }
    return equalBuffers(privateKey, itemPrivateKey)
  })
}

/**
 * Get an account by providing a private key
 * @param {object} privateKey hex buffer or string
 * @return {object} [description]
 */
Accounts.prototype.privateKeyToAccount = function(privateKey) {
  let accounts = this
  let account =
    this._findAccountByPk(privateKey) || new Account({accounts, privateKey})
  // this.wallet.add(account)
  return account
}

Accounts.prototype.signTransaction = function(tx, privateKey, done) {
  let accounts = this

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

  let steps = {}
  let account =
    this._findAccountByPk(privateKey) || this.privateKeyToAccount(privateKey)
  let transaction = Object.assign({}, signTransactionDefaults, tx)

  let {_nacl} = account

  if (transaction.from === undefined) {
    transaction.from = account.address
  }

  if (transaction.chainId === undefined) {
    // get chain id
    steps.chainId = done => this.getId(done)
  }

  if (transaction.gasPrice === undefined) {
    // get gas price
    steps.gasPrice = done => this.getGasPrice(done)
  }

  if (transaction.nonce === undefined) {
    // get transaction count to use as nonce
    steps.nonce = done =>
      this.getTransactionCount(account.address, 'latest', done)
  }

  if (transaction.nonce !== undefined) {
    transaction.nonce = transaction.nonce.toString()
  }

  function sign(res) {
    transaction = Object.assign({}, transaction, res)
    /*let [valid, error] = validateTransaction(transaction)

    if (valid === false) {
      throw error
    }*/

    let {to, data, value, gas, gasLimit, gasPrice, nonce, chainId} = transaction

    // console.log('transaction', transaction)

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
    RLP_TX_TIMESTAMP = 4,
    RLP_TX_NRG = 5
    RLP_TX_NRGPRICE = 6
    RLP_TX_TYPE = 7
    RLP_TX_SIG = 8

    */

    function rlpNum(val) {
      return toBuffer(val).toString('hex')
    }

    let rlpValues = [
      rlpNum(nonce),
      to.toLowerCase(),
      rlpNum(value),
      data,
      rlpNum(Date.now().toString()),
      rlpNum(gas),
      rlpNum(gasPrice),
      rlpNum(chainId || '0x1')
    ]

    // console.log('rlpValues', rlpValues)

    let encoded = rlp.encode(rlpValues)

    // console.log('encoded', encoded)

    let messageHash = keccak256(encoded)

    // console.log('messageHash', messageHash)

    let {signature} = accounts.sign(messageHash, privateKey)

    signature = toBuffer(signature)

    // console.log('signature', signature)
    // console.log('signature.length', signature.length)

    let rawTx = rlp.decode(encoded)

    // console.log('1 rawTx', rawTx)
    rawTx.push(signature)
    // console.log('2 rawTx', rawTx)

    let rawTransaction = rlp.encode(rawTx)

    messageHash = bytesToHex(messageHash)
    signature = bytesToHex(signature)
    rawTransaction = bytesToHex(rawTransaction)

    return {
      messageHash,
      signature,
      rawTransaction
      /*v: rawTx[6],
      r: rawTx[7],
      s: rawTx[8]*/
    }
  }

  // callback
  if (isFunction(done) === true) {
    return parallel(steps, (err, res) => {
      if (err !== undefined && err !== null) {
        return done(err)
      }

      try {
        let op = sign(res)
        done(null, op)
      } catch (e) {
        done(e)
      }
    })
  }

  // Promise
  return new Promise((resolve, reject) => {
    parallel(steps, (err, res) => {
      if (err !== undefined && err !== null) {
        return reject(err)
      }

      try {
        resolve(sign(res))
      } catch (e) {
        reject(e)
      }
    })
  })
}

Accounts.prototype.recoverTransaction = function(rawTx) {
  throw new Error(`recoverTransaction not yet implemented ${rawTx}`)
}

/**
 * Hashed Aion signed message with preamble
 * @param {string} message
 * @return {buffer} keccak256 hash
 */
Accounts.prototype.hashMessage = function(message) {
  let messageBuffer = toBuffer(message)
  let len = messageBuffer.length
  let preamble = `\x19Aion Signed Message:\n${len}`
  let preambleBuffer = toBuffer(preamble)
  return keccak256(Buffer.concat([preambleBuffer, messageBuffer]))
}

/**
 * Sign the message with account address and message signature
 * @param {string} message
 * @param {buffer} privateKey
 * @return {object} contains message, messageHash, signature
 */
Accounts.prototype.sign = function(message, privateKey) {
  let {address, _nacl} =
    this._findAccountByPk(privateKey) || this.privateKeyToAccount(privateKey)
  let messageHash = this.hashMessage(message)
  let messageSignature = nacl.sign(toBuffer(messageHash), _nacl.secretKey)
  /*let signature = Buffer.concat([toBuffer(address), messageSignature]).toString(
    'hex'
  )*/
  let signature = Buffer.concat([_nacl.publicKey, messageSignature])
    .slice(0, nacl.sign.publicKeyLength + nacl.sign.signatureLength)
    .toString('hex')
  return {
    message,
    messageHash,
    signature
  }
}

/**
 * The Aion address is the first 64 bytes of the signature
 * @param {object|string} message
 * @param {string|buffer} signature
 * @return {string} the signing address
 */
Accounts.prototype.recover = function(message, signature) {
  return toBuffer(signature || message.signature)
    .slice(0, 32)
    .toString('hex')
}

/**
 * Encrypt an account to keystore v3 format
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
 * @return {object} [description]
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
  let mac = keccak256(Buffer.concat([keyEnd, cipherBuf])).toString('hex')
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
  let mac = keccak256(Buffer.concat([keyEnd, cipherBuf]))

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

module.exports = Accounts
