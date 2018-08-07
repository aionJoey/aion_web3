/**
 * @module Bzz
 */

/**
 * Bzz protocol is not implemented on Aion
 *
 * Using this constructor will `throw`.
 *
 * @constructor Bzz
 */
function Bzz() {
  throw new Error(`bzz isn't implemented on aion`)
}

module.exports = Bzz
