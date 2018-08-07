/**
 * Aion doesn't implement Shh protocol. Use of this module will give
 * feedback to the user about it being disabled.
 * @module Shh
 */

function Shh() {
  throw new Error(`shh isn't implemented on aion`)
}

module.exports = Shh
