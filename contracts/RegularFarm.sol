// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface BeanInterface {
    function mint(address to, uint amount) external;
    function balanceOf(address account) external;
    function transfer(address to, uint amount) external;
    function transferFrom(address from, address to, uint value) external;
}

contract RegularFarm is Ownable{

    BeanInterface beanContract;
    struct StakedBalance {
        uint stakedAmount
        uint lastClaimed
    }
    mapping(address => StakedBalance) stakedBalance;

    constructor() Ownable(msg.sender) {

    }

    /*
        Usually when UI press stake 2 things are called
            1. approve(this.address, amount) 
            2. stake(amount) <- This function
    */
    function stake() external{
        require(beanContract.balanceOf(msg.sender) > 0);
        //approve(this.address, amount) already called
        beanContract.transferFrom(msg.sender, this.address, beanContract.balanceOf(msg.sender));
        //add to stakedBalance
        StakedBalance storage staker = stakedBalance[msg.sender];
        staker.stakedAmount += amount;
        if (staker.lastClaimed == 0) {
            staker.lastClaimed = block.timestamp;
        } 
    }

    function unstake() external {
        // Must have more beans than unstaked amount
        require(stakedBalance[msg.sender].stakedAmount > 0);
        // Claim reward
        uint reward = calculateReward(msg.sender);
        beanContract.mint(msg.sender, reward);
        // Transfer back staked to account
        beanContract.transfer(msg.sender, stakedBalance.stakedAmount);
        // Deduct from staking balance
        stakedBalance[msg.sender].stakedAmount -= amount;
    }

    function getAmountStake() view external returns(uint) {
        return stakedBalance[msg.sender];
    }

    function claim() external{
        // calculate reward without unstaking.
        uint reward = calculateReward(msg.sender);
        // mint reward to msg.sender
        beanContract.mint(msg.sender, reward);
        // Update last claimed to recent
        stakedBalance[claimer].lastClaimed = block.timstamp;
    }

    function setBeanContract(address beanAddress) external onlyOwner { 
        beanContract = BeanInterface(beanAddress);
    }

    // Fixed rate 1 bean per minute (no matter how many bean you stake)
    function calculateReward(address staker) internal {
        uint timeElapsed = block.timestamp - stakedBalances[staker].lastClaimed;
        return timeElapsed / 60
    }

}