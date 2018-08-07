# Iban

+ [Iban](#Iban)
+ [toAddress](#toAddress)
+ [toIban](#toIban)
+ [fromEthereumAddress](#fromEthereumAddress)
+ [fromBban](#fromBban)
+ [createIndirect](#createIndirect)
+ [isValid](#isValid)
+ [isDirect](#isDirect)
+ [isIndirect](#isIndirect)
+ [checmsum](#checmsum)
+ [institution](#institution)
+ [client](#client)
+ [toString](#toString)
+ [toAddress](#toAddress)
+ [toIban](#toIban)
+ [fromBban](#fromBban)
+ [isValid](#isValid)
+ [isDirect](#isDirect)
+ [isIndirect](#isIndirect)
+ [checksum](#checksum)

## Iban

+ ibanAddress, `string`

Iban constructor `new Iban(ibanAddress)`

## toAddress

*instance member*

+ ibanAddress, `[type]`, *optional*
+ returns `[type]` 

Convert IBAN to Aion address

## toIban

*instance member*

+ aionAddress, `string`
+ returns `object` 

Convert an Aion address into an Iban object

## fromEthereumAddress

*instance member*

+ aionAddress, `string`
+ returns `object` 

Create an Iban from **Aion** address

It's still named fromEthereumAddress for API compatibility

## fromBban

*instance member*

+ bbanAddress, `string`
+ returns `object` 

Create Iban instance from BBAN address

## createIndirect

*instance member*

+ options.institution, `string`
+ options.identifier, `string`
+ returns `object` 

Use institution and identifier to create BBAN and then IBAN

## isValid

*instance member*

+ ibanAddress, `string`, *optional*
+ returns `boolean` 

Check if the address is valid

## isDirect

*instance member*

+ ibanAddress, `string`, *optional*
+ returns `boolean` 

IBAN address is direct

## isIndirect

*instance member*

+ ibanAddress, `string`, *optional*
+ returns `Boolean` 

IBAN address is indirect

## checmsum

*instance member*

+ ibanAddress, `string`, *optional*
+ returns `string` 

Output checksum address

## institution

*instance member*

+ returns `string` 

Get the institution part of the address

## client

*instance member*

+ returns `string` 

Get the client part of the address

## toString

*instance member*

+ returns `string` 

Get the IBAN address

## toAddress

*static member*

+ address, `string`
+ returns `string` 

Convert IBAN to Aion address

## toIban

*static member*

+ address, `string`
+ returns `string` the IBAN address

Convert Aion address to IBAN address

## fromBban

*static member*

+ bbanAddress, `string`
+ returns `object` 

Create Iban instance from BBAN address

## isValid

*static member*

+ ibanAddress, `string`
+ returns `boolean` 

Check if the IBAN address is valid

## isDirect

*static member*

+ ibanAddress, `string`
+ returns `boolean` 

True if direct IBAN address

## isIndirect

*static member*

+ ibanAddress, `string`
+ returns `boolean` 

True if ibanAddress is indirect

## checksum

*static member*

+ ibanAddress, `string`
+ returns `string` 

Return IBAN checksum address

