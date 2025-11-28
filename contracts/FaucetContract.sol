// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FaucetContract
 * @dev Each faucet has its own contract that holds MON tokens
 * Users can mine tokens (0.01 MON per mine) if they're within radius
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FaucetContract {
    // MON token address (update with actual token contract)
    address public immutable MON_TOKEN;
    
    // Owner of the faucet (can fund and manage)
    address public immutable owner;
    
    // Amount to mine per transaction (0.01 MON = 10000000000000000 wei for 18 decimals)
    uint256 public constant MINE_AMOUNT = 0.01 * 10**18;
    
    // Minimum time between mines from same address (1 minute)
    uint256 public constant COOLDOWN_PERIOD = 60;
    
    // Track last mine time per address
    mapping(address => uint256) public lastMineTime;
    
    // Events
    event Mined(address indexed miner, uint256 amount, uint256 timestamp);
    event Funded(address indexed funder, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor(address _monToken, address _owner) {
        MON_TOKEN = _monToken;
        owner = _owner;
    }
    
    /**
     * @dev Mine tokens from the faucet
     * Can be called repeatedly but with cooldown
     */
    function mine() external {
        // Check cooldown
        require(
            block.timestamp >= lastMineTime[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown period not passed"
        );
        
        // Check contract has enough balance
        IERC20 monToken = IERC20(MON_TOKEN);
        uint256 balance = monToken.balanceOf(address(this));
        require(balance >= MINE_AMOUNT, "Insufficient funds in faucet");
        
        // Update last mine time
        lastMineTime[msg.sender] = block.timestamp;
        
        // Transfer tokens to miner
        require(
            monToken.transfer(msg.sender, MINE_AMOUNT),
            "Token transfer failed"
        );
        
        emit Mined(msg.sender, MINE_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Fund the faucet with MON tokens
     * Only owner can fund
     */
    function fund(uint256 amount) external {
        IERC20 monToken = IERC20(MON_TOKEN);
        require(
            monToken.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        emit Funded(msg.sender, amount);
    }
    
    /**
     * @dev Get current balance of the faucet
     */
    function getBalance() external view returns (uint256) {
        IERC20 monToken = IERC20(MON_TOKEN);
        return monToken.balanceOf(address(this));
    }
    
    /**
     * @dev Check if address can mine (cooldown check)
     */
    function canMine(address miner) external view returns (bool) {
        if (block.timestamp < lastMineTime[miner] + COOLDOWN_PERIOD) {
            return false;
        }
        IERC20 monToken = IERC20(MON_TOKEN);
        return monToken.balanceOf(address(this)) >= MINE_AMOUNT;
    }
    
    /**
     * @dev Withdraw remaining tokens (emergency only, owner)
     */
    function withdraw(uint256 amount) external onlyOwner {
        IERC20 monToken = IERC20(MON_TOKEN);
        require(
            monToken.transfer(owner, amount),
            "Token transfer failed"
        );
    }
}

