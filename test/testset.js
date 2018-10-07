"use strict";

//TODO: these literal hashes should be created dynamiccaly in testscript

const player1TestSet = [
    { password: 'test1', choice: 1, hash: '0x9f692a11e36ebd3c778ea726030f7fba0a741cb93598a18cfca30ac1eb67bb99' },
    { password: 'test3', choice: 3, hash: '0xe784662d8736b414500d7aa9e0dfc44e978e60505558cd878edead217c9b3037' },
    { password: 'test5', choice: 2, hash: '0x622a91f0a4530935e08082094a31424cd90282ed85e89f3047ef48e2a400ea72' }
]

const player2TestSet = [
    { password: 'test2', choice: 2, hash: '0x55902940f745e9e5fc625c627036a0ebc5d769a85a375dbe6bc06343ae5cc72e' },
    { password: 'test4', choice: 1, hash: '0xb1eac95bfe4d5e531cf008c84f535873162159d3a32c0693f4c93f42a03a9227' },
    { password: 'test6', choice: 3, hash: '0x955fdf56b65401fc810442de51e973580abf69ca2c9d3f9803a1f7ce1dd3238b' }
]

module.exports = {
    player1TestSet: player1TestSet,
    player2TestSet: player2TestSet
};