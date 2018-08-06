# eth

+ [Eth](#Eth)
+ [subscribe](#subscribe)
+ [clearSubscriptions](#clearSubscriptions)

## Eth

+ provider, `object`
+ providerOpts, `object`

Work with the Eth-like web3 interface for Aion

## subscribe

*instance member* / *deprecated: one*

+ evtName, `string`, event name
+ opts, `object`, *optional*
+ opts.fromBlock, `number`
+ opts.address, `string|array`
+ opts.topics, `array`
+ done, `function`
+ returns `object` 

Subscribe to server events

Subscribe to these events:
+ pendingTransactions
+ newBlockHeaders
+ syncing
+ logs, options {fromBlock, address, topics}

Emitter events:
+ data, object
+ change, object
+ error, Error

## clearSubscriptions

*instance member*

+ keepSyncing, `boolean`, clear all except syncing
+ returns `boolean` 

Unsubscribe on this instance of Eth

