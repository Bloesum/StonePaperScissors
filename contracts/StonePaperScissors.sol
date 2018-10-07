pragma solidity 0.4.24;

contract StonePaperScissors {
    
    //RULES OF THE GAME:
    //2 players play one game with multiple sets. Each player onboard with minimum fo 1000 Wei
    //Player with best of 3 sets wins games.C hoices: 1 = stone, 2 = scissors and 3 = paper
    
    struct Choice {
        bytes32 hash;
        int8 sps;
    }
    
    mapping (address => Choice) choices;
    address[] public players;
    uint public choiceCount;
    uint public revealCount;
    uint public amount;
    uint public setsPlayer1;
    uint public setsPlayer2;
    address public winner;
    
    event logOnBoarding(address indexed _player, uint indexed _amount);
    event logCommitChoice(address indexed _player);
    event logRevealChoice(address indexed _player);
    event logGetWinnerGame(address indexed _winner);
    event logGetPrice(address indexed _winner, uint indexed _amount);
    
    constructor () public {
    }
    
    function hashHelper(string password, address sender, int8 sps) public pure returns(bytes32 hashPass) {
        return keccak256(abi.encodePacked(password,sender, sps));
    }
    
    function onboardGame () public payable {
        require(msg.value > 1000, "Deposit too low to start game");
        require(players.length  < 2, "Only two person can take part in this games");
        emit logOnBoarding(msg.sender, msg.value);
        players.push(msg.sender);
        amount += msg.value;
    }
    
    modifier onlyStartedGame() {
        require(players.length == 2, "Game must start with 2 players");
        require((setsPlayer1 + setsPlayer2) < 3, "Game ends after 3 sets");
        _;
    }
    
    function commitChoice (bytes32 _hash) public onlyStartedGame {
        //committer should first hash his password, adres and choice offchain
        require(players[0] == msg.sender || players[1] == msg.sender, "Player not yet onboarded");
        require(choiceCount < 3, "A set only needs 2 choices");
        require(choices[msg.sender].hash == "", "user already sent a choice");
        choices[msg.sender].hash = _hash;
        choiceCount ++;
        emit logCommitChoice(msg.sender);
    }
    
    function revealChoice (string _password, int8 _sps) public onlyStartedGame {
        require(choiceCount > 1, "Second person has not voted yet");
        require(hashHelper(_password, msg.sender, _sps) == choices[msg.sender].hash, "Reveal does not equal commit");
        choices[msg.sender].sps = _sps;
        revealCount ++;
        choices[msg.sender].hash = "";
        emit logRevealChoice(msg.sender);
        if (revealCount == 2) {
            getWinnerSet();
        }
    }
    
    function getWinnerSet () internal {
        int8 spsDiff = choices[players[0]].sps - choices[players[1]].sps;
        if (spsDiff == -1 || spsDiff == 2) {
            setsPlayer1 ++;
        } else if (spsDiff == 1 || spsDiff == -2) {
            setsPlayer2 ++;
        }
        choiceCount = 0;
        revealCount = 0;
        if (((setsPlayer1 + setsPlayer2) == 3) || (setsPlayer1 == 2) || (setsPlayer2 == 2)) {
            getWinnerGame();
        }
    }
    
    function getWinnerGame () internal {
        if (setsPlayer1 > setsPlayer2) {
            winner = players[0];
        } else {
            winner = players[1];
        }
        emit logGetWinnerGame(winner);
        delete players;
    }
    
    function getPrice () public {
        uint amount2 = amount;
        require(winner != 0, "Price already paid");
        delete winner;
        delete amount;
        delete choiceCount;
        delete revealCount;
        delete setsPlayer1;
        delete setsPlayer2;
        emit logGetPrice(winner, amount2);
        winner.transfer(amount2);
    }
    
}