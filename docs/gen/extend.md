# extend

+ [extend](#extend)

## extend

+ options, `object`
+ options.property, `string`, property name to attach to the object, *optional*
+ options.methods, `array`

Usage:

```js
web3.extend({
methods: [
{
// the name of the method to attach
name: 'methodName',
// RPC call name on the node implementation
call: 'rpc_call_name',
// how many parameters does it take?
params: 2,
// provide a formatter or `null` for each param
// `null` means no formatter, just pass the param as-is
inputFormatter: [lowercaseFormatter, uppercaseFormatter]
// format the output from the RPC call
outputFormatter: outputBigNumberFormatter
// before the payload is sent inspect or transform it
// return the payload when done
transformPayload: (val) => val
}
]
})
```

