# Accounts

+ [Accounts](#Accounts)
+ [create](#create)
+ [privateKeyToAccount](#privateKeyToAccount)
+ [signTransaction](#signTransaction)
+ [recoverTransaction](#recoverTransaction)
+ [hashMessage](#hashMessage)
+ [sign](#sign)
+ [recover](#recover)
+ [encrypt](#encrypt)
+ [decrypt](#decrypt)

## Accounts

+ provider, `object`
+ providerOpts, `object`, options

Accounts constructor

## create

*instance member*

+ entropy, `object`, hex buffer or string
+ returns `object` 

Create Account using randomized data

## privateKeyToAccount

*instance member*

+ privateKey, `object`, hex buffer or string
+ returns `object` 

Get an account by providing a private key

## signTransaction

*instance member*

+ tx, `object`
+ tx.nonce, `buffer`, *optional*
+ tx.to, `buffer`, *optional*
+ tx.value, `buffer`, *optional*
+ tx.data, `buffer`, *optional*
+ tx.timestamp, `buffer`, *optional*
+ tx.gas, `number`, nrg in aion terms, *optional*
+ tx.gasPrice, `number`, nrg price, *optional*
+ tx.type, `buffer`, defaults to 0x01, for future use, *optional*
+ privateKey, `buffer`
+ done, `function`
+ returns `object` promise

Sign a transaction object with a private key.

The timestamp is specific to Aion. It's calculated automatically
from `Math.floor(Date.now() / 1000)`.

## recoverTransaction

*instance member*

+ rawTx, `string`
+ returns `string` 

Given a signature it will recover the Aion address.

## hashMessage

*instance member*

+ message, `string`
+ returns `buffer` blake2b256 hash

Hashed Aion signed message with preamble

## sign

*instance member*

+ message, `string`
+ privateKey, `buffer`
+ returns `object` contains message, messageHash, signature

Sign the message with account address and message signature

## recover

*instance member*

+ message, `object|string`
+ signature, `string|buffer`
+ returns `string` the signing address

The Aion address is the first 64 bytes of the signature

## encrypt

*instance member*

+ privateKey, `buffer`
+ password, `string|Buffer`
+ options, `object`
+ options.kdf, `string`, pbkdf2 or scrypt
+ options.salt, `buffer`, *optional*
+ options.iv, `buffer`, initialization vector, *optional*
+ options.dklen, `number`, key length bytes, *optional*
+ options.c, `number`, pbkdf2 c variable, *optional*
+ options.n, `number`, scrypt n variable, *optional*
+ options.r, `number`, scrypt r variable, *optional*
+ options.p, `number`, scrypt p variable, *optional*
+ options.scryptProgress, `function`, arguments (current, total, percent), *optional*
+ options.cipher, `number`, algorithm, *optional*
+ options.uuid, `number`, random bytes for id, *optional*
+ returns `object` 

Encrypt an account to keystore v3 format

## decrypt

*instance member*

+ ksv3, `object`
+ password, `string`
+ nonStrict, `boolean`
+ returns `object` account

Decrypt the keystorev3 object

