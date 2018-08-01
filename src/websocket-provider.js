/*

Developer notes:
If it looks complicated it's because it's trying to intelligently
connect, reconnect, and send messages but there's no request-response
paradigm. It relies on sending an `id` then watching messages that come back
with that `id`.

It uses console due to there not yet being an interface for giving
feedback to the API consumer.

*/

let WebSocket = require('ws')

function WebsocketProvider(url, opts) {
  let prov = {}
  let client
  let handlers = {}
  let connectTries = 0
  let connectTriesMax = 10

  let connect = () => {
    connectTries += 1

    if (connectTries > connectTriesMax) {
      /* eslint-disable no-console */
      console.error('aion web3 websocket provider')
      /* eslint-enable no-console */
    }

    client = new WebSocket(url, opts)

    client.on('message', res => {
      let body = JSON.parse(res)
      if (body.id !== undefined && handlers[body.id] !== undefined) {
        handlers[body.id](body)
      }
    })

    client.on('error', err => {
      /* eslint-disable no-console */
      console.error('websocket provider error', err)
      /* eslint-enable no-console */
    })
  }

  prov.send = (payload, done) => {
    let sendTries = 0
    let sendTriesMax = 10
    let sent = false
    let finished = false
    let tryTimer

    // random message id so we know how to get our response
    let id = Math.random()
      .toString()
      .substring(2)

    let body = JSON.stringify(Object.assign({}, payload, {id}))

    let cleanup = () => {
      finished = true
      clearInterval(tryTimer)
      delete handlers[id]
    }

    // message response handler
    handlers[id] = body => {
      if (finished === true) {
        return
      }

      let {error, result} = body

      if (error !== undefined) {
        return done(error)
      }

      done(null, result)
      cleanup()
    }

    if (client === undefined) {
      connect()
    }

    if (client.readyState === 1) {
      // already connected, just send
      client.send(body)
      return
    }

    let retry = () => {
      sendTries += 1

      if (sent === true || finished === true) {
        // already finished, do nothing
        return
      }

      if (sendTries > sendTriesMax) {
        // too many
        sent = true
        done(
          new Error(`
            WebSocket send failed,
            Send tries:  ${sendTries},
            Max send tries: ${sendTriesMax}
          `)
        )
        cleanup()
        return
      }

      if (client.readyState === 0) {
        // waiting to connect
        return
      }

      if (client.readyState === 1) {
        // connected again, send!
        client.send(body)
        sent = true
        return
      }

      if (client.readyState === 2) {
        // disconnecting
        return
      }

      if (client.readyState === 3) {
        // disconnected, reconnect
        connect()
        return
      }
    }

    tryTimer = setInterval(retry, 50)
  }

  return prov
}

module.exports = WebsocketProvider
