/**
 * Used internally by `Accounts`
 * @module Wallet
 */

let {isString, each} = require('underscore')
let {isBuffer, toBuffer} = require('./lib/formats')
let {isAccountAddress} = require('./lib/accounts')

let nonAccountKeys = ['_accounts', 'length', 'defaultKeyName']

/**
 * Wallet constructor
 * @constructor Wallet
 * @param {object} accounts
 */
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

/**
 * Add account
 * @instance
 * @method add
 * @param {object} val
 */
Wallet.prototype.add = function(val) {
  let account = val
  if (isString(val) === true || isBuffer(val) === true) {
    account = this._accounts.privateKeyToAccount(toBuffer(val))
  }
  this[account.address] = account
  this._recalculateLength()
  return account
}

/**
 * Create accounts
 * @instance
 * @method create
 * @param {number} numberOfAccounts
 * @param {object} entropy
 * @returns {object} wallet instance
 */
Wallet.prototype.create = function(numberOfAccounts, entropy) {
  for (let i = 0; i < numberOfAccounts; ++i) {
    this.add(this._accounts.create(entropy))
  }
  return this
}

/**
 * Remove an account
 * @instance
 * @method remove
 * @param {string} address
 * @returns {boolean} true if anything was removed
 */
Wallet.prototype.remove = function(address) {
  let exists = this._hasAddress(address)
  delete this[address]
  this._recalculateLength()
  return exists
}

/**
 * Clear all accounts
 * @instance
 * @method clear
 * @returns {object} wallet
 */
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

/**
 * Encrypt all accounts
 * @instance
 * @method encrypt
 * @param {string} password
 * @param {object} options
 * @returns {array} array of keystorev3 objects
 */
Wallet.prototype.encrypt = function(password, options) {
  return this._getPrivateKeys().map(privateKey =>
    this._accounts.encrypt(privateKey, password, options)
  )
}

/**
 * Decrypt array of keystorev3s
 * @instance
 * @method decrypt
 * @param {array} keystores
 * @param {string} password
 * @returns {object} wallet
 */
Wallet.prototype.decrypt = function(keystores, password) {
  each(keystores, keystore => {
    let account = this._accounts.decrypt(keystore, password)
    this.add(account)
  })
  return this
}

/**
 * Encrypt all wallets and save into `window.localStorage`
 * @instance
 * @method save
 * @param {string} password
 * @param {string} [keyName]
 * @returns {boolean}
 */
Wallet.prototype.save = function(password, keyName) {
  if (typeof window === 'undefined') {
    throw new Error('wallet save is a browser local storage function')
  }
  let op = this.encrypt(password, {kdf: 'pbkdf2'})
  op = JSON.stringify(op)
  window.localStorage.setItem(keyName || this.defaultKeyName, op)
  return true
}

/**
 * Decrypt accounts from `window.localStorage` and load into wallet
 * @instance
 * @method load
 * @param {string} password
 * @param {string} [keyName]
 * @returns {object} wallet
 */
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
