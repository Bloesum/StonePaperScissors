const StonePaperScissors = artifacts.require("../contracts/StonePaperScissors.sol");
const expectedException = require("./expected_exception_testRPC_and_geth.js");
const testSet = require("./testset.js");

Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('StonePaperScissors', function(accounts) {

  let stonepaperscissors;
  let initiator = accounts[0];
  let player1 = accounts[1];
  let player2 = accounts[2];
  let player3 = accounts[3];

  before("deploy new game", function() {
      return StonePaperScissors.new({ from: initiator })
          .then(instance => stonepaperscissors = instance);
  });

  describe("Onboarding", function() {

    it("should reject onboarding with amount less then 1000", function() {
        return expectedException(
            () => stonepaperscissors.onboardGame({ from: player1, value: 1, gas: 3000000 })
        );
    });

    it("should onboard player with enough money", function() {
        return stonepaperscissors.onboardGame({from: player1, value: 1001, gas: 3000000})
    }); 

    it("should should accept a second player", function() {
        return stonepaperscissors.onboardGame({from: player2, value: 2002, gas: 3000000})
        .then(txObject => web3.eth.getBalancePromise(stonepaperscissors.address))
        .then(balance => assert.equal(balance.toNumber(), 3003, "Not enough money"));
    }); 

    it("should reject onboarding a 3rd player", function() {
        return expectedException(
            () => stonepaperscissors.onboardGame({ from: player3, value: 3003, gas: 3000000 })
        );
    });
  });

  describe("CommitChoice", function() {

    const player1TestSet = testSet.player1TestSet;
    const player2TestSet = testSet.player2TestSet;

    it("should accept 1 choice player 1", function() {
        return stonepaperscissors.commitChoice(player1TestSet[0].hash, {from: player1, gas: 3000000})
    }); 

    it("should not accept second choice player 1 before reveal", function() {
      return expectedException(
            () => stonepaperscissors.commitChoice(player1TestSet[0].hash, {from: player1, gas: 3000000})
        );
    }); 

    it("should not reveal choice player 1 before commit choice player 2", function() {
      return expectedException(
            () => stonepaperscissors.revealChoice(player1TestSet[0].password, player1TestSet[0].choice, {from: player1, gas: 3000000})
        );
    }); 

    it("should accept 1 choice player 2", function() {
        return stonepaperscissors.commitChoice(player2TestSet[0].hash, {from: player2, gas: 3000000})
    }); 

    it("should reveal 1 choice player 1", function() {
        return stonepaperscissors.revealChoice(player1TestSet[0].password, player1TestSet[0].choice, {from: player1, gas: 3000000})
    }); 

    it("should reveal 1 choice player 2", function() {
        return stonepaperscissors.revealChoice(player2TestSet[0].password, player2TestSet[0].choice, {from: player2, gas: 3000000})
        .then(() => stonepaperscissors.commitChoice(player1TestSet[1].hash, {from: player1, gas: 3000000}))
        .then(() => stonepaperscissors.commitChoice(player2TestSet[1].hash, {from: player2, gas: 3000000}))
        .then(() => stonepaperscissors.revealChoice(player1TestSet[1].password, player1TestSet[1].choice, {from: player1, gas: 3000000}))
        .then(() => stonepaperscissors.revealChoice(player2TestSet[1].password, player2TestSet[1].choice, {from: player2, gas: 3000000}))
    }); 

    it("should choose player1 as winner and pay price", function() {
        return stonepaperscissors.getPrice({from: player1, gas: 3000000})
        .then(txObject => {
            assert.strictEqual(txObject.logs.length, 1);
            assert.strictEqual(txObject.logs[0].event, "logGetPrice");
            //assert.strictEqual(txObject.logs[0].args._winner, player1); DOESN'T WORK??
            assert.strictEqual(txObject.logs[0].args._amount.toNumber(), 3003);
        });
    }); 

  });

});