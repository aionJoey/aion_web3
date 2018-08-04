/*

it can be a bit complex since it's passing context to the
methods it's assigned. for now the input and output formatters
rely on the context.

*/

let get = require('lodash/get')
let set = require('lodash/set')
let {each, isFunction} = require('underscore')

// the simplest imput formatter 😉
let simpleGetValue = val => val

function assignExtend(context, {methods = []}) {
  // Gives web3, eth, bzz, and etc. rpc methods
  function createRpcMethod({
    // name,
    call,
    // params count
    params,
    inputFormatter,
    outputFormatter,
    transformPayload
  }) {
    let methodParamCount = params

    return function createRpcMethodInner(...args) {
      let done

      // random request id for each request
      let id = Math.random()
        .toString()
        .substring(2)

      let provider = context.currentProvider

      // the method can be a function returning the rpc call
      let method = typeof call === 'function' ? call(args) : call

      let payloadParams = []

      // batch request applies this with context
      let batch = get(this, 'batch') || false

      if (isFunction(args[args.length - 1]) === true) {
        // the last arg is a callback
        done = args.pop()
      }

      // let it still work if they don't define a param count
      let paramCount = methodParamCount || args.length

      // input formatters can be an array providing a function for each
      // or just null even. when null we provide the backup formatter
      let formatters = inputFormatter || simpleGetValue

      // always turn it into an array even with one arg
      if (isFunction(formatters) === true) {
        formatters = [formatters]
      }

      for (let i = 0; i < paramCount; i += 1) {
        let arg = args[i] || null
        let formatter = formatters[i] || simpleGetValue
        // called in the context given to assignExtend
        payloadParams[i] = formatter.call(context, arg)
      }

      // this params is the rpc call arguments as an array
      let payload = {method, params: payloadParams, id}

      if (transformPayload !== undefined) {
        payload = transformPayload(payload)
      }

      let preDone = val => {
        if (outputFormatter !== undefined && val !== undefined) {
          // called in the context given to assignExtend
          return outputFormatter.call(context, val)
        }

        return val
      }

      // promise api
      if (done === undefined || batch === true) {
        return new Promise((resolve, reject) => {
          provider.send(payload, (err, res) => {
            if (err !== null && err !== undefined) {
              // attach more info to error for the developer
              err.args = args
              err.payload = payload
              err.id = id

              // batch mode is like a promise-callback combo
              if (batch === true && done !== undefined) {
                done(err)
              }

              return reject(err)
            }

            let op = preDone(res)

            // batch mode is like a promise-callback combo
            if (isFunction(done) === true) {
              done(op)
            }

            resolve(op)
          })
        })
      }

      provider.send(payload, (err, res) => {
        if (err !== null && err !== undefined) {
          // attach more info to error for the developer
          err.args = args
          err.payload = payload
          return done(err)
        }

        let op = preDone(res)
        done(null, op)
      })
    }
  }

  context.extend = ({property, methods}) => {
    each(methods, item => {
      let path = `${item.name}`

      if (property !== undefined) {
        path = `${property}.${path}`
      }

      set(context, path, createRpcMethod(item))
    })
  }

  context.extend({methods})
}

module.exports = {assignExtend}
