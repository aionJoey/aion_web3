# Wallet

+ [Wallet](#Wallet)
+ [add](#add)
+ [create](#create)
+ [remove](#remove)
+ [clear](#clear)
+ [encrypt](#encrypt)
+ [decrypt](#decrypt)
+ [save](#save)
+ [load](#load)

Used internally by `Accounts`

## Wallet

+ accounts, `object`

Wallet constructor

## add

*instance member*

+ val, `object`

Add account

## create

*instance member*

+ numberOfAccounts, `number`
+ entropy, `object`
+ returns `object` wallet instance

Create accounts

## remove

*instance member*

+ address, `string`
+ returns `boolean` true if anything was removed

Remove an account

## clear

*instance member*

+ returns `object` wallet

Clear all accounts

## encrypt

*instance member*

+ password, `string`
+ options, `object`
+ returns `array` array of keystorev3 objects

Encrypt all accounts

## decrypt

*instance member*

+ keystores, `array`
+ password, `string`
+ returns `object` wallet

Decrypt array of keystorev3s

## save

*instance member*

+ password, `string`
+ keyName, `string`, *optional*
+ returns `boolean` 

Encrypt all wallets and save into `window.localStorage`

## load

*instance member*

+ password, `string`
+ keyName, `string`, *optional*
+ returns `object` wallet

Decrypt accounts from `window.localStorage` and load into wallet

