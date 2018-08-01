let {isString, each} = require('underscore')
let {isBuffer, toBuffer} = require('./lib/formats')
let {isAccountAddress} = require('./lib/accounts')

let nonAccountKeys = ['_accounts', 'length', 'defaultKeyName']

function Wallet(accounts) {
  this._accounts = accounts
  this.length = 0
  this.defaultKeyName = 'web3js_wallet'
}

Wallet.prototype._recalculateLength = function() {
  this.length = Object.keys(this).length - nonAccountKeys.length
}

Wallet.prototype._hasAddress = function(address) {
  return (
    Object.keys(this)
      .map(item => item.toLowerCase())
      .indexOf(address.toLowerCase()) > -1
  )
}

Wallet.prototype.add = function(val) {
  let account = val
  if (isString(val) === true || isBuffer(val) === true) {
    account = this._accounts.privateKeyToAccount(toBuffer(val))
  }
  this[account.address] = account
  this._recalculateLength()
  return account
}

Wallet.prototype.create = function(numberOfAccounts, entropy) {
  for (let i = 0; i < numberOfAccounts; ++i) {
    this.add(this._accounts.create(entropy))
  }
  return this
}

Wallet.prototype.remove = function(address) {
  let exists = this._hasAddress(address)
  delete this[address]
  this._recalculateLength()
  return exists
}

Wallet.prototype.clear = function() {
  let wallet = this
  Object.keys(this).forEach(key => {
    if (isAccountAddress(key) === true) {
      delete wallet[key]
    }
  })
  wallet._recalculateLength()
  return this
}

Wallet.prototype._getPrivateKeys = function() {
  let items = []
  each(this, (val, key) => {
    if (isAccountAddress(key) === true && val.privateKey !== undefined) {
      items.push(val.privateKey)
    }
  })
  return items
}

Wallet.prototype.encrypt = function(password, options) {
  return this._getPrivateKeys().map(privateKey =>
    this._accounts.encrypt(privateKey, password, options)
  )
}

Wallet.prototype.decrypt = function(keystores, password) {
  each(keystores, keystore => {
    let account = this._accounts.decrypt(keystore, password)
    this.add(account)
  })
  return this
}

Wallet.prototype.save = function(password, keyName) {
  if (typeof window === 'undefined') {
    throw new Error('wallet save is a browser local storage function')
  }
  let op = this.encrypt(password, {kdf: 'pbkdf2'})
  op = JSON.stringify(op)
  window.localStorage.setItem(keyName || this.defaultKeyName, op)
  return true
}

Wallet.prototype.load = function(password, keyName) {
  if (typeof window === 'undefined') {
    throw new Error('wallet load is a browser local storage function')
  }
  let keystoresText = window.localStorage.getItem(
    keyName || this.defaultKeyName
  )
  let keystores = JSON.parse(keystoresText)
  this.decrypt(keystores, password)
  return this
}

module.exports = Wallet
