const StonePaperScissors = artifacts.require("../contracts/StonePaperScissors.sol");
const expectedException = require("./expected_exception_testRPC_and_geth.js");
const testSet = require("./testset.js");

Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('StonePaperScissors', function(accounts) {

  let stonepaperscissors;
  const initiator = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const player3 = accounts[3];
  const player1TestSet = testSet.player1TestSet;
  const player2TestSet = testSet.player2TestSet;
  let player1Hash1, player1Hash2, player2Hash1, player2Hash2;

  beforeEach("deploy new game", function() {
    return StonePaperScissors.new({ from: initiator })
    .then(instance => stonepaperscissors = instance)
    .then(() => stonepaperscissors.hashHelper(player1TestSet[0].password, player1, player1TestSet[0].choice))
    .then((hash) => player1Hash1 = hash)
    .then(() => stonepaperscissors.hashHelper(player1TestSet[1].password, player1, player1TestSet[1].choice))
    .then((hash) => player1Hash2 = hash)
    .then(() => stonepaperscissors.hashHelper(player2TestSet[0].password, player2, player2TestSet[0].choice))
    .then((hash) => player2Hash1 = hash)
    .then(() => stonepaperscissors.hashHelper(player2TestSet[1].password, player2, player2TestSet[1].choice))
    .then((hash) => player2Hash2 = hash)
  });

  it("should reject onboarding with amount less then 1000", function() {
      return expectedException(() => stonepaperscissors.onboardGame({ from: player1, value: 1, gas: 3000000 })
      );
  });

  it("should should accept two players", function() {
      return stonepaperscissors.onboardGame({from: player1, value: 1001, gas: 3000000})
         .then(txObject => stonepaperscissors.onboardGame({from: player2, value: 1001, gas: 3000000}))
         .then(txObject => web3.eth.getBalancePromise(stonepaperscissors.address))
         .then(balance => assert.equal(balance.toString(10), 2002, "Not enough money"))
  }); 

  it("should should not onboard a third players", function() {
      return stonepaperscissors.onboardGame({from: player1, value: 1001, gas: 3000000})
         .then(txObject => stonepaperscissors.onboardGame({from: player2, value: 1001, gas: 3000000}))
         .then(expectedException(() => stonepaperscissors.onboardGame({ from: player3, value: 3003, gas: 3000000 })));
  }); 

  describe("CommitChoice", function() {

    beforeEach("onboard players", function() {
      return stonepaperscissors.onboardGame({from: player1, value: 1001, gas: 3000000})
      .then(txObject => stonepaperscissors.onboardGame({from: player2, value: 1001, gas: 3000000}));
    });

    it("should accept 1 choice player 1", function() {
      return stonepaperscissors.commitChoice(player1Hash1, {from: player1, gas: 3000000})
    }); 

    it("should reveal 1st choice player 1", function() {
      return stonepaperscissors.commitChoice(player1Hash1, {from: player1, gas: 3000000})
        .then(txObject => stonepaperscissors.commitChoice(player2Hash1, {from: player2, gas: 3000000}))
        .then(txObject => stonepaperscissors.revealChoice(player1TestSet[0].password, player1TestSet[0].choice, {from: player1, gas: 3000000}));
      }); 

    it("should not accept second choice player 1 before reveal", function() {
      return stonepaperscissors.commitChoice(player1Hash1, {from: player1, gas: 3000000})
      .then(expectedException(() => stonepaperscissors.commitChoice(player1Hash2, {from: player1, gas: 3000000})));
    });

    it("should not reveal choice player 1 before commit choice player 2", function() {
      return stonepaperscissors.commitChoice(player1Hash1, {from: player1, gas: 3000000})
      .then(expectedException(() => stonepaperscissors.revealChoice(player1TestSet[0].password, player1TestSet[0].choice, {from: player1, gas: 3000000})));
    }); 

    describe("RevealChoice", function(){

      beforeEach("commit 2 choices", function() {
        return stonepaperscissors.commitChoice(player1Hash1, {from: player1, gas: 3000000})
        .then(txObject => stonepaperscissors.commitChoice(player2Hash1, {from: player2, gas: 3000000}));
      });

      it("should not reveal choice with wrong password", function() {
        return expectedException(() => stonepaperscissors.revealChoice("wrong password", player1TestSet[0].choice, {from: player1, gas: 3000000}));
      });

      it("should reveal 1st choice player 1", function() {
        return stonepaperscissors.revealChoice(player1TestSet[0].password, player1TestSet[0].choice, {from: player1, gas: 3000000})
      }); 

      describe("EndGame", function() {

        beforeEach("commit & reveal all choices", function() {
          return stonepaperscissors.revealChoice(player1TestSet[0].password, player1TestSet[0].choice, {from: player1, gas: 3000000})
          .then(() => stonepaperscissors.revealChoice(player2TestSet[0].password, player2TestSet[0].choice, {from: player2, gas: 3000000}))
           .then(txObject => stonepaperscissors.commitChoice(player1Hash2, {from: player1, gas: 3000000}))
           .then(txObject => stonepaperscissors.commitChoice(player2Hash2, {from: player2, gas: 3000000}))
           .then(txObject => stonepaperscissors.revealChoice(player1TestSet[1].password, player1TestSet[1].choice, {from: player1, gas: 3000000}))
           .then(txObject => stonepaperscissors.revealChoice(player2TestSet[1].password, player2TestSet[1].choice, {from: player2, gas: 3000000}));
        });

        it("should choose player1 as winner and pay price", function() {
          return stonepaperscissors.getPrice({from: player1, gas: 3000000})
          .then(txObject => {
            assert.strictEqual(txObject.logs.length, 1);
            assert.strictEqual(txObject.logs[0].event, "logGetPrice");
            assert.strictEqual(txObject.logs[0].args._winner, player1);
            assert.strictEqual(txObject.logs[0].args._amount.toNumber(), 2002);
            assert.equal(0x01, txObject.receipt.status, "No price paid");
          });
        });
      }); 
    });
  });
});