/*

aion cases sourced from conqeust test network
https://conquest-api.aion.network/aion/dashboard/getAccountStatistics

ethereum cases sourced from here:
https://github.com/ethereum/web3.js/blob/1.0/test/utils.isChecksumAddress.js

*/
let addresses = [
  // SECURITY: we need to validate these. they are only assumed to be valid
  {
    address:
      '0xa07c95cc8729a0503c5ad50eb37ec8a27cd22d65de3bb225982ec55201366920',
    checksumAddress:
      '0xA07C95cC8729a0503C5ad50eb37eC8a27cD22D65dE3BB225982Ec55201366920',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa05a3889b106e75baa621b8cc719679a3dbdd799afac1ca6b42d03dc93a23687',
    checksumAddress:
      '0xa05A3889b106e75baA621b8cC719679a3dBdD799afac1ca6B42D03DC93A23687',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa0229e43f4a040f9fa6b2ab2f2cccc066025117def3414e08edbe7aee8e61647',
    checksumAddress:
      '0xA0229E43f4a040F9fa6B2AB2F2Cccc066025117def3414E08EdbE7aeE8e61647',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa0dd16394f16ea21c8b45c00b2e43850ae7e8f00fe54789ddd1881d33b21df0c',
    checksumAddress:
      '0xa0Dd16394f16Ea21C8B45C00b2E43850aE7E8f00fe54789ddD1881D33B21DF0C',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa046cc48bcde4b0b2ce2dbefb318f3778946b6c0011f691ecc4025cc145a93d3',
    checksumAddress:
      '0xa046Cc48Bcde4B0B2CE2dbeFB318f3778946B6C0011F691ecc4025Cc145a93d3',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa0e1cca4fe786118c0abb1fdf45c04e44354f971b25c04ed77ac46f13cae179a',
    checksumAddress:
      '0xA0e1CcA4fE786118c0abb1fdF45C04e44354f971B25C04ED77aC46f13CaE179a',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa0b1b3f651990669c031866ec68a4debfece1d3ffb9015b2876eda2a9716160b',
    checksumAddress:
      '0xA0B1b3f651990669c031866ec68A4debfECe1d3fFb9015B2876EDa2A9716160b',
    validChecksum: true,
    validAddress: true
  },
  {
    address:
      '0xa012123456789012345678901234567890123456789012345678901234567890',
    checksumAddress:
      '0xa012123456789012345678901234567890123456789012345678901234567890',
    validChecksum: true,
    validAddress: true
  },
  // lowercased aion addresses which are not valid checksum addresses
  {
    address:
      '0xa0e1cca4fe786118c0abb1fdf45c04e44354f971b25c04ed77ac46f13cae179a',
    checksumAddress:
      '0xa0e1cca4fe786118c0abb1fdf45c04e44354f971b25c04ed77ac46f13cae179a',
    validChecksum: false,
    validAddress: true
  },
  {
    address:
      '0xa0b1b3f651990669c031866ec68a4debfece1d3ffb9015b2876eda2a9716160b',
    checksumAddress:
      '0xa0b1b3f651990669c031866ec68a4debfece1d3ffb9015b2876eda2a9716160b',
    validChecksum: false,
    validAddress: true
  },
  // uppercased aion addresses which are not valid checksum addresses
  {
    address:
      '0xa0e1cca4fe786118c0abb1fdf45c04e44354f971b25c04ed77ac46f13cae179a',
    checksumAddress:
      '0XA0E1CCA4FE786118C0ABB1FDF45C04E44354F971B25C04ED77AC46F13CAE179A',
    validChecksum: false,
    validAddress: true
  },
  {
    address:
      '0xa0b1b3f651990669c031866ec68a4debfece1d3ffb9015b2876eda2a9716160b',
    checksumAddress:
      '0XA0B1B3F651990669C031866EC68A4DEBFECE1D3FFB9015B2876EDA2A9716160B',
    validChecksum: false,
    validAddress: true
  },
  {
    address:
      '0xa012123456789012345678901234567890123456789012345678901234567890',
    checksumAddress:
      '0XA012123456789012345678901234567890123456789012345678901234567890',
    validChecksum: false,
    validAddress: true
  },
  // valid ethereum addresses and checksum addresses but not for aion
  {
    throws: true,
    address: '0x27b1fdb04752bbc536007a920d24acb045561c26',
    checksumAddress: '0x27b1fdb04752bbc536007a920d24acb045561c26',
    validChecksum: false,
    validAddress: false
  },
  {
    throws: true,
    address: '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed',
    checksumAddress: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    validChecksum: false,
    validAddress: false
  },
  {
    throws: true,
    address: '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359',
    checksumAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    validChecksum: false,
    validAddress: false
  },
  {
    throws: true,
    address: '0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb',
    checksumAddress: '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
    validChecksum: false,
    validAddress: false
  },
  {
    throws: true,
    address: '0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb',
    checksumAddress: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    validChecksum: false,
    validAddress: false
  }
]

module.exports = addresses
