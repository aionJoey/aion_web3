/*

it can be a bit complex since it's passing context to the
methods it's assigned. for now the input and output formatters
rely on the context.

*/

let get = require('lodash/get')
let set = require('lodash/set')
let {each, isFunction, isEmpty} = require('underscore')

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
    let paramCount = params

    return function createRpcMethodInner(...args) {
      // let req = {}
      let done
      let provider = context.currentProvider
      // the method can be a function
      let method = typeof call === 'function' ? call(args) : call
      let params = []
      // batch request applies this with context
      let batch = get(this, 'batch') || false

      // args = Array.from(args)

      if (isFunction(args[args.length - 1]) === true) {
        // the last arg is a callback
        done = args.pop()
      }

      // expecting array but...
      let formatters = inputFormatter || simpleGetValue

      // always turn it into an array even with one arg
      if (isFunction(formatters) === true) {
        formatters = [formatters]
      }

      for (let i = 0; i < paramCount; i += 1) {
        let arg = args[i] || null
        let formatter = formatters[i] || simpleGetValue
        // called in the context given to assignExtend
        params[i] = formatter.call(context, arg)
      }

      // this params is the rpc call arguments as an array
      let payload = {method, params}

      if (isEmpty(transformPayload) === false) {
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
              // batch mode is like a promise-callback combo
              if (batch === true && isEmpty(done) === false) {
                done(err)
              }
              return reject(err)
            }

            let {error, result} = res

            if (error !== null && error !== undefined) {
              let msg
              if (typeof error === 'object') {
                msg = Object.keys(error)
                  .map(key => `${key}: ${JSON.stringify(error[key])}`)
                  .join(',')
              }

              if (typeof error === 'string') {
                msg = error
              }

              msg = `server error ${msg}`
              // batch mode is like a promise-callback combo
              if (batch === true && isEmpty(done) === false) {
                done(err)
              }
              return reject(new Error(msg))
            }

            let op = preDone(result)
            // batch mode is like a promise-callback combo
            if (isFunction(done) === true) {
              done(op)
            }
            resolve(op)
          })
        })
      }

      // callback api
      provider.send(payload, (err, res) => {
        if (err !== null && err !== undefined) {
          return done(err)
        }

        done(null, preDone(res.result))
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
