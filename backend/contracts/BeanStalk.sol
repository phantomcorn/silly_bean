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
    struct Prediction {
        bool hasResolved;
        uint stakedAmount;
        uint currPrice;
        uint createdAt;
        bool isHigher;

        uint endingPrice; //assigned once resolved
        bool correct; //assigned once resolved
    }

    uint beansOnTheHouse;
    mapping(address => StakedBalance) stakedBalance;
    Prediction[] predictions;
    
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

    function getPredictionRounds() view external returns(Prediction[] memory) {
        uint LENGTH_LIMIT = 5;
        uint limit = predictions.length < LENGTH_LIMIT ? predictions.length : LENGTH_LIMIT;
        uint start = predictions.length - limit;

        Prediction[] memory limitedPredictions = new Prediction[](limit);
        for (uint i = 0; i < limit; i++) {
            limitedPredictions[i] = predictions[start + i];
        }
        
        return limitedPredictions;
    }

    function getBeansOnTheHouse() view external returns(uint) {
        return beansOnTheHouse;
    }

    function lockInPredict(uint amount, bool higher) external {
        require(stakedBalance[msg.sender].stakedAmount >= amount, "Insufficient funds.");
        //Single player (1 player = 1 round)
        Prediction memory newPrediction;
        newPrediction.createdAt = block.timestamp;
        newPrediction.currPrice = getOraclePrice();
        newPrediction.stakedAmount = amount;
        newPrediction.isHigher = higher;
        predictions.push(newPrediction);
    }

    function resolve() external {
        require(predictions.length > 0, "Cannot resolve without any prediction.");
        Prediction storage currRound = predictions[predictions.length - 1];
        require(block.timestamp - currRound.createdAt >= 10, "Try again in 10 seconds.");
        require(!currRound.hasResolved, "Round has already ended.");
        bool expectation = currRound.isHigher;
        uint actualPrice = getOraclePrice();
        bool actual = actualPrice > currRound.currPrice;
        bool correct = (expectation && actual) || (!expectation && !actual);
        if (correct) {
            uint reward = calculateReward(currRound.stakedAmount);
            beanContract.mint(address(this), reward);
            stakedBalance[msg.sender].stakedAmount += reward;
            stakedBalance[msg.sender].earnSoFar += reward;
        } else {
            stakedBalance[msg.sender].stakedAmount -= currRound.stakedAmount;
            beansOnTheHouse += currRound.stakedAmount;
        }
        currRound.endingPrice = actualPrice;
        currRound.hasResolved = true;
        currRound.correct = correct;
    }

    function getOraclePrice() internal view returns(uint) {
        (,int answer,,,) = priceFeed.latestRoundData();
        return uint(answer);
    }

    function getOracleDecimals() external view returns(uint8) {
        return priceFeed.decimals();
    }

    function calculateReward(uint amount) internal pure returns(uint) {
        return amount*2;
    }
}   