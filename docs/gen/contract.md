# contract

+ [Contract](#Contract)
+ [clone](#clone)
+ [deploy](#deploy)

## Contract

+ jsonInterface, `object`
+ address, `string`
+ options, `object`

An object that facilitates working with smart contracts

## clone

*instance member*

+ returns `object` 

Copy the Contract object

## deploy

+ options, `object`
+ options.data, `string`, smart contract bytes in hex
+ options.arguments, `array`, smart contract contructor arguments
+ returns `object` 

Deploy the contract

