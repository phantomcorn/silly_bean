// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface BeanInterface {
    function mint(address to, uint amount) external;
    function balanceOf(address account) external returns(uint);
    function transfer(address to, uint amount) external;
    function transferFrom(address from, address to, uint value) external;
}
//ETH/USD price feed address: 0x694AA1769357215DE4FAC081bf1f309aDC325306
contract BeanStalk {

    BeanInterface beanContract;
    AggregatorV3Interface priceFeed;

    struct StakedBalance {
        uint stakedAmount;
        uint earnSoFar;
    }
    uint currPrice;
    uint lastUpdated;
    uint beansOnTheHouse;
    mapping(address => StakedBalance) stakedBalance;
    
    constructor(address beanContractAddress, address ethUsdAddress) {
        beanContract = BeanInterface(beanContractAddress);
        priceFeed = AggregatorV3Interface(ethUsdAddress);
    }

    /*
        Usually when UI press stake 2 things are called
            1. approve(this.address, amount) 
            2. stake(amount) <- This function
    */
    function stake(uint amount) external {
        require(beanContract.balanceOf(msg.sender) >= amount, "Insufficient funds.");
        //approve(this.address, amount) already called
        beanContract.transferFrom(msg.sender, address(this), amount);
        //add to stakedBalance
        StakedBalance storage staker = stakedBalance[msg.sender];
        staker.stakedAmount = amount;
    }

    function unstake(uint amount) external {
        // Must have more beans than unstaked amount
        require(stakedBalance[msg.sender].stakedAmount >= amount, "Insufficient funds.");
        // Transfer back staked to account
        beanContract.transfer(msg.sender, amount);
        
        if (amount == stakedBalance[msg.sender].stakedAmount) {
            // Reset staking balance to default value
            delete stakedBalance[msg.sender];
        } else {
            stakedBalance[msg.sender].stakedAmount -= amount;
        }
        
    }

    function getAmountStake() view external returns(uint) {
        return stakedBalance[msg.sender].stakedAmount;
    }

    function getEarnSoFar() view external returns(uint) {
        return stakedBalance[msg.sender].earnSoFar;
    }

    function getCurrPrice() view external returns(uint) {
        return currPrice;
    }

    function getBeansOnTheHouse() view external returns(uint) {
        return beansOnTheHouse;
    }

    function predict(uint amount, bool higher) external {
        require(stakedBalance[msg.sender].stakedAmount >= amount, "Insufficient funds.");

        uint newPrice = getOraclePrice();
        bool isHigher = newPrice > currPrice;
        bool correct = (higher && isHigher) || (!higher && !isHigher);
        if (correct) {
            uint reward = amount*2;
            beanContract.mint(address(this), reward);
            stakedBalance[msg.sender].stakedAmount += reward;
            stakedBalance[msg.sender].earnSoFar += reward;
        } else {
            stakedBalance[msg.sender].stakedAmount -= amount;
            beansOnTheHouse += amount;
        }
        currPrice = getOraclePrice();
        lastUpdated = block.timestamp;
    }

    function getOraclePrice() internal view returns(uint) {
        (,int answer,,,) = priceFeed.latestRoundData();
        return uint(answer);
    }

    function refresh() public {
        require(block.timestamp - lastUpdated >= 10, "Cannot refresh.");

        currPrice = getOraclePrice();
        lastUpdated = block.timestamp;
    }
}   