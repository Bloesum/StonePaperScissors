"use strict";

//With this testscript player1 will win with 2-0

const player1TestSet = [
    { password: 'test1', choice: 1 },
    { password: 'test3', choice: 3 },
    { password: 'test5', choice: 2 }
]

const player2TestSet = [
    { password: 'test2', choice: 2 },
    { password: 'test4', choice: 1 },
    { password: 'test6', choice: 3 }
]

module.exports = {
    player1TestSet: player1TestSet,
    player2TestSet: player2TestSet
};