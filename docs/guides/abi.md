
# Aion ABI guide

Given these types and parameters:

```
let types =  ['address[]', 'bool', 'int[2]']
let params = [
  [
    '0xa07c95cc8729a0503c5ad50eb37ec8a27cd22d65de3bb225982ec55201366920',
    '0xa05a3889b106e75baa621b8cc719679a3dbdd799afac1ca6b42d03dc93a23687',
    '0xa0229e43f4a040f9fa6b2ab2f2cccc066025117def3414e08edbe7aee8e61647'
  ],
  false,
  [6, 7]
]
abi.encodeParameters(types, params)
```

It need to do some calculations of offsets for these multidimensional arrays.

Fully encoded it looks like:

`0x00000000000000000000000000000030000000000000000000000000000000a0000000000000000000000000000000b000000000000000000000000000000003a07c95cc8729a0503c5ad50eb37ec8a27cd22d65de3bb225982ec55201366920a05a3889b106e75baa621b8cc719679a3dbdd799afac1ca6b42d03dc93a23687a0229e43f4a040f9fa6b2ab2f2cccc066025117def3414e08edbe7aee8e61647000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000007`

Unpacked into lines it looks like this:

```
00000000000000000000000000000030 <- offset to A
000000000000000000000000000000a0 <- offset to B
000000000000000000000000000000b0 <- offset to C
00000000000000000000000000000003 <- A, length of array of addresses
a07c95cc8729a0503c5ad50eb37ec8a27cd22d65de3bb225982ec55201366920 <- address 0
a05a3889b106e75baa621b8cc719679a3dbdd799afac1ca6b42d03dc93a23687 <- address 1
a0229e43f4a040f9fa6b2ab2f2cccc066025117def3414e08edbe7aee8e61647 <- address 2
00000000000000000000000000000000 <- B, false
00000000000000000000000000000006 <- C, fixed array, 7
00000000000000000000000000000007 <- 7
```

Call the method called `abi.encodeParametersIntermediate({types, params})` to get detailed information how it will be calculated. This is Aion-specific.

That's how it works!

You can view the unit tests for simple and elaborite examples of what it's doing.

There should also be an analyzer and validator for this at some point in the future. Then if it can show the code path through the smart contract that would be optimal.
