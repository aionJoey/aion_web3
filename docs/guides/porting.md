# Modules: `require` or `import`

Ethereum web3: `require('web3-utils')`

Aion web3: `require('aion-web3/utils')`

# Addresses

Ethereum
`0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb`
Length 42

Aion
`0xa07c95cc8729a0503c5ad50eb37ec8a27cd22d65de3bb225982ec55201366920`
Length 66

# Solidity data types

**Only use up to `int128` or `uint128`**. Aion FastVM only goes up to 128 bit for performance purposes.

This module may `throw` in instances when trying to use `int256` and `uint256` to it will try to give you feedback.

[More here](https://github.com/aionnetwork/aion_fastvm/wiki/Migration-Guide)

Addresses cannot be reduced to 16 bytes and are an exception to the rule.
