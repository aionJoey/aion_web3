let HttpProvider = require('./http-provider')
let IpcProvider = require('./ipc-provider')
let WebsocketProvider = require('./websocket-provider')
let values = require('./lib/values')

function assignProvider(
  context,
  {provider = values.rpc.url, providerOpts = {}}
) {
  context.givenProvider = null
  context.currentProvider = null

  context.providers = {
    HttpProvider,
    WebsocketProvider,
    IpcProvider
  }

  // recursive set provider
  context.setProvider = function(provider, providerOpts) {
    let prov = provider

    if (prov === undefined) {
      throw new Error('no provider or url was given')
    }

    // user passed a string url and options
    if (typeof provider === 'string') {
      if (
        provider.startsWith('http://') === true ||
        provider.startsWith('https://') === true ||
        provider.startsWith('//') === true
      ) {
        prov = new HttpProvider(provider, providerOpts)
      }

      if (
        provider.startsWith('ws://') === true ||
        provider.startsWith('wss://') === true
      ) {
        prov = new WebsocketProvider(provider, providerOpts)
      }

      if (provider.startsWith('/') === true) {
        prov = new IpcProvider(provider, providerOpts)
      }
    }

    context.currentProvider = prov
  }

  if (provider !== undefined) {
    context.setProvider(provider, providerOpts)
  }
}

module.exports = {assignProvider}
