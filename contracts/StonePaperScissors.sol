pragma solidity 0.4.24;

contract Casino {
    
    struct Player {
        uint total;
        bool isCheckedIn;
        address[] gameID;
    }
    
    mapping (address => Player) public Players;
    
    struct Game {
        uint wager;
        bytes32 secret;
        bool gameEnded;
        bool active;
    }
    
    mapping (address => Game) public Games;
    
    event logCheckIn(address indexed player, uint indexed amount);
    event logCheckOut(address indexed player, uint indexed amount);
    event logStartTable(address indexed player, uint indexed wager, bytes32 secret);
    
    BlackListInterface blI;

    constructor(address blacklist) public {
        blI = BlackListInterface(blacklist);
    }
    
    modifier notBlackListed() {
        require(!blI.isBlackListed(msg.sender));
        _;
    }
    
    function checkIn() public notBlackListed payable returns (bool success) {
        require(!isPlayer(msg.sender), "Player is already checked in" );
        Players[msg.sender].total = msg.value;
        Players[msg.sender].isCheckedIn = true;
        emit logCheckIn(msg.sender, msg.value);
        return true;
    }
    
    function checkOut() public {
        require(isPlayer(msg.sender), "Player not checked in");
        //Close all open games this player started
        for (uint i = 0; i < Players[msg.sender].gameID.length; i++) {
            address thisGame = Players[msg.sender].gameID[i];
            if (Games[thisGame].gameEnded == false) {
                Games[thisGame].gameEnded = true;
                uint wager2 = Games[thisGame].wager; //Is this ok?
                Games[thisGame].wager = 0;
                TableGame(thisGame).cleanUp();
                Players[msg.sender].total += wager2;
            }
        }
        uint withdraw = Players[msg.sender].total;
        Players[msg.sender].total = 0;
        emit logCheckOut(msg.sender, withdraw);
        msg.sender.transfer(withdraw);
    }
    
    function isPlayer(address player) public view returns (bool isIndeed) {
        return Players[player].isCheckedIn;
    }
    
    function getGame(address player, address game) internal view returns (bool success) {
        for (uint i = 0; i < Players[player].gameID.length; i++) {
            address thisGame = Players[msg.sender].gameID[i];
            if (thisGame == game) {
                return true;
            }
        }
    }
    
    function startGame(uint wager, bytes32 _secret) public returns (address newTable) {
        require(isPlayer(msg.sender), "Player not checked in");
        require(Players[msg.sender].total >= wager, "Can't bet more money then you own");
        //Check reuse secrets
        for (uint i = 0; i < Players[msg.sender].gameID.length; i++) {
            address thisGame = Players[msg.sender].gameID[i];
            if (Games[thisGame].secret == _secret) {
                revert("Choose a new secret!");
            }
        }
        
        TableGame tablegame = new TableGame(msg.sender, _secret, wager);
        Players[msg.sender].total -= wager;
        Players[msg.sender].gameID.push(address(tablegame)); //becomes owner
        Games[address(tablegame)].gameEnded = false;
        Games[address(tablegame)].wager = wager;
        Games[address(tablegame)].active = true;
        Games[address(tablegame)].secret = _secret;
        emit logStartTable(msg.sender, wager, _secret);
        return address(tablegame);
    }
    
    function addToBalance(address player, uint amount, address game) public returns (bool success) {
        require(getGame(msg.sender, game) || Games[msg.sender].active, "No existing combination");
        Players[player].total += amount;
        return true;
    }
    
    function substractFromBalance(address player, uint amount, address game) public returns (bool success) {
        require(getGame(msg.sender, game), "No existing combination");
        Players[player].total -= amount;
        return true;
    }
    
    function setStatusGame(address game) public returns (bool success) {
        require(getGame(msg.sender, game), "No existing combination");
        Games[game].gameEnded = true;
        return true;
    }
}

contract BlackListInterface { //Just for the fun of it
    
    mapping(address => bool) public isBlackListed;
    function blacklistPlayer(address badPlayer) public returns (bool success);
}

contract BlackList is BlackListInterface {
    
    mapping(address => bool) public isBlackListed;
    
    event logBlacklistPlayer(address indexed player);
    
    function blacklistPlayer(address badPlayer) public returns (bool success) {
        require(!isBlackListed[badPlayer]);
        isBlackListed[badPlayer] = true;
        emit logBlacklistPlayer(badPlayer);
        return true;
    }
}

contract TableGame {
    
    uint public amount;
    address public owner;
    bool public gameEnded;
    bytes32 public secret;
    int8 public choice2;
    address public firstPlayer;
    address public secondPlayer;
    address public winner;
    address public looser;
    
    event logCleanUp(address indexed firstPlayer, uint indexed amount);
    event logJoinGame(address indexed secondPlayer, int8 choice);
    event logfinishGame(address indexed winner, uint indexed amount, bool indexed draw);
    
    constructor(address _player, bytes32 _secret, uint _amount) public { //First move
        amount = _amount;
        owner = msg.sender;
        gameEnded = false;
        secret = _secret;
        firstPlayer = _player;
    }
    
    function cleanUp() public returns (bool success) {
        require(msg.sender == owner, "You are not the owner to clean up");
        require(gameEnded == false, "Game is already won");
        uint amount2 = amount;
        amount = 0;
        gameEnded = true;
        emit logCleanUp(firstPlayer, amount2);
        Casino(owner).addToBalance(firstPlayer, amount, address(this));
        return true;
    }
    
    function hashHelper(string password, address sender, int8 stonePaperScissorsChoice) public pure returns(bytes32 hashPass) {
        return keccak256(abi.encodePacked(password,sender, stonePaperScissorsChoice));
    }
    
    function joinGame(int8 _choice, uint wager) public returns (bool success) {
        require(wager == amount, "You should bet as much as challenger");
        amount += wager;
        choice2 = _choice;
        secondPlayer = msg.sender;
        emit logJoinGame(secondPlayer, _choice);
        Casino(owner).substractFromBalance(secondPlayer, wager, address(this));
        return true;
    }
    
    function finishGame (string _password, int8 _stonePaperScissorsChoice) public returns (bool success) {
        require(_stonePaperScissorsChoice != 0, "second player has not made a choice yet");
        require(hashHelper(_password, msg.sender, _stonePaperScissorsChoice) == secret, "Reveal does not equal commit");
        gameEnded = true;
        uint amount2;
        amount2 = amount;
        amount = 0;
        int8 spsDiff = _stonePaperScissorsChoice - choice2;
        if (spsDiff == -1 || spsDiff == 2) {
            winner = firstPlayer;
        } else if (spsDiff == 1 || spsDiff == -2) {
            winner = secondPlayer;
        } else {
            emit logfinishGame(0, 0, true);
            Casino(owner).setStatusGame(address(this));
            Casino(owner).addToBalance(firstPlayer, amount2 / 2, address(this));
            Casino(owner).addToBalance(secondPlayer, amount2 / 2, address(this));
            return true;
        }
        emit logfinishGame(winner, amount, false);
        Casino(owner).addToBalance(winner, amount2, address(this));
        Casino(owner).setStatusGame(address(this));
        return true;
    }
}