# utils

+ [randomHex](#randomHex)
+ [_](#_)
+ [BN](#BN)
+ [BN](#BN)
+ [toBN](#toBN)
+ [isBN](#isBN)
+ [isBigNumber](#isBigNumber)
+ [isHex](#isHex)
+ [isHexStrict](#isHexStrict)
+ [hexToBytes](#hexToBytes)
+ [padLeft](#padLeft)
+ [](#)
+ [padRight](#padRight)
+ [rightPad](#rightPad)
+ [bytesToHex](#bytesToHex)
+ [sha3](#sha3)
+ [keccak256](#keccak256)
+ [isAddress](#isAddress)
+ [checkAddressChecksum](#checkAddressChecksum)
+ [utf8ToHex](#utf8ToHex)
+ [numberToHex](#numberToHex)
+ [toHex](#toHex)
+ [soliditySha3](#soliditySha3)
+ [toChecksumAddress](#toChecksumAddress)
+ [hexToNumberString](#hexToNumberString)
+ [hexToNumber](#hexToNumber)
+ [hexToUtf8](#hexToUtf8)
+ [hexToAscii](#hexToAscii)
+ [asciiToHex](#asciiToHex)
+ [](#)
+ [blake2b256](#blake2b256)

## randomHex

+ size, `number`, how many bytes
+ returns `string` randomly generated hex value starting with '0x'

Generate random hex values of a certain length

## _

+ returns `function` 

underscore module

## BN

## BN

Constructor for bn.js

It would be the same as `require('bn.js')`

## toBN

+ val, `object`
+ returns `object` BN

Convert number to BN

## isBN

+ val, `object`
+ returns `boolean` 

BN.isBN

## isBigNumber

+ obj, `object`
+ returns `boolean` 

Is it a `BigNumber` or not?

## isHex

+ val, `string`
+ returns `boolean` 

Checks if a value is a hex value

0x number expressions return false but '0x' string expressions true

## isHexStrict

+ val, `string`
+ returns `boolean` 

Checks if a value is hex starting with '0x'

## hexToBytes

+ hex, `string|number|BN`
+ returns `array` the byte array

Convert a hex string to a byte array

## padLeft

+ val, `string|number|BN|BigNumber`
+ length, `number`, how many of the pad sign
+ sign, `string`

Put padding to the left. The default padding sign is '0'

## 

Alias to padLeft

## padRight

+ val, `string|number|BN|BigNumber`
+ quantity, `number`, how many of the pad sign
+ sign, `string`

Put padding to the right. The default padding sign is '0'

## rightPad

Alias to padRight

## bytesToHex

+ val, `array`, bytes
+ returns `string` 

Convert array of bytes into hex string with 0x prepended

## sha3

+ val, `string|array`
+ returns `string` keccak256 hash

Compute SHA3 256 length hash a.k.a. keccak256

Prepends '0x' string to the result

## keccak256

+ val, `string|array`
+ returns `string` keccak256 hash

Alias to utils.sha3

## isAddress

+ val, `string`
+ returns `boolean` 

True if valid Aion account address

## checkAddressChecksum

+ val, `string`
+ returns `boolean` 

Returns true if the address checksum calculates correctly

## utf8ToHex

+ val, `string`
+ returns `string` 

Convert utf8 string to hex string starting with 0x

## numberToHex

+ val, `number|BN|BigNumber`
+ returns `string` 

Convert number to hex string with leading 0x

## toHex

+ val, `object`
+ returnType, `string`, *optional*
+ returns `string` 

It's used internally to convert addresses, booleans, objects, strings,
and numbers into hex for solidity sha3.

## soliditySha3

+ 
+ returns `string` 

Converts all the arguments into some other format then hashes it with sha3.

## toChecksumAddress

+ val, `string`
+ returns `string` 

Convert an Aion address to an Aion Checksum address.

Rather than being all lower or uppercase letters are upper or lower based
on some critera.

## hexToNumberString

+ val, `string`
+ returns `string` 

Convert hex string to number string

## hexToNumber

+ val, `string`
+ returns `number` 

Convert hex string to javascript number

## hexToUtf8

+ val, `string`
+ returns `string` 

Convert hex string to utf8 string

## hexToAscii

+ val, `string`
+ returns `string` 

Convert hex string to ASCII encoded string

## asciiToHex

+ val, `[type]`, *optional*
+ returns `[type]` 

Convert ASCII to hex encoded string with leading 0x

## 

+ val, `number|BN|BigNumber`
+ returns `string` 

Twos Compliment binary number function to hex string with leading 0x

## blake2b256

+ val, `[type]`, *optional*
+ returns `[type]` 

blake2b 256 hash string with leading 0x

