/**
 * @module BatchRequest
 */

let series = require('async/series')

/**
 * @constructor BatchRequest
 */
function BatchRequest() {
  this.steps = []
}

/**
 * Add an RPC call to the queue
 * @instance
 * @method add
 * @param {object} step
 */
BatchRequest.prototype.add = function(step) {
  this.steps.push(step)
}

/**
 * Execute the RPC calls
 * @instance
 * @method execute
 * @returns {object}
 */
BatchRequest.prototype.execute = function() {
  let context = Object.assign({}, this.constructor, {batch: true})

  // convert all steps into promise-to-callback functions
  let steps = this.steps.map(item => done => {
    item
      // run the rpc method in series
      .bind(context)
      // the user gets a separate callback in batch mode
      .then(() => done())
      .catch(() => done())
  })
  // execute in series
  series(steps)
}

module.exports = BatchRequest
