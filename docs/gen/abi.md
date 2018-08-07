# abi

+ [encodeEventSignature](#encodeEventSignature)
+ [encodeFunctionSignature](#encodeFunctionSignature)
+ [encodeParameters](#encodeParameters)
+ [encodeParameter](#encodeParameter)
+ [encodeFunctionCall](#encodeFunctionCall)
+ [decodeParameters](#decodeParameters)
+ [decodeParameter](#decodeParameter)
+ [decodeLog](#decodeLog)

ABI encoding and decoding

## encodeEventSignature

+ val, `string|object`
+ returns `string` 

Encode event to its ABI signature

## encodeFunctionSignature

+ val, `string|object`
+ returns `string` 

Encode function to its ABI signature

## encodeParameters

+ types, `array`
+ params, `array`
+ returns `string` 

Encode a list of parameters to ABI signature

## encodeParameter

+ type, `string`
+ param, `string|array|object`
+ returns `string` 

Encode parameter to ABI signature

## encodeFunctionCall

+ jsonInterface, `object`
+ params, `array`
+ returns `string` 

Encode function call to ABI signature

## decodeParameters

+ types, `array`
+ val, `string`
+ returns `array` 

Decode the parameters hex into an array of decoded values

## decodeParameter

+ type, `string`
+ val, `string`
+ returns `string` 

Decode a parameter value from it's ABI encoding

## decodeLog

+ inputs, `array`
+ val, `string`
+ topics, `array`
+ returns `array` 

ABI decoded log data

