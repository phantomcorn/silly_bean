// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {PredictionQueue} from "./PredictionQueue.sol";

interface BeanInterface {
    function mint(address to, uint amount) external;
    function balanceOf(address account) external returns(uint);
    function transfer(address to, uint amount) external;
    function transferFrom(address from, address to, uint value) external;
}
// struct PredictionQueue.PredictionRound {
//     uint roundNum;
//     bool hasResolved;
//     uint stakedAmount;
//     uint currPrice;
//     uint createdAt;
//     bool isHigher;
//     uint endingPrice; //assigned once resolved
//     bool correct; //assigned once resolved
// }

//ETH/USD price feed address: 0x694AA1769357215DE4FAC081bf1f309aDC325306
contract BeanStalk {

    BeanInterface beanContract;
    AggregatorV3Interface priceFeed;
    uint nextRoundNum;
    PredictionQueue queue;
    struct StakedBalance {
        uint stakedAmount;
        uint earnSoFar;
    }
    
    uint public totalStake;
    uint public beansOnTheHouse;

    mapping(address => StakedBalance) stakedBalance;

    
    constructor(address beanContractAddress, address ethUsdAddress) {
        beanContract = BeanInterface(beanContractAddress);
        priceFeed = AggregatorV3Interface(ethUsdAddress);
        queue = new PredictionQueue();
        nextRoundNum = 1;
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
        staker.stakedAmount += amount;
        totalStake += amount;
    }

    function unstake(uint amount) external {
        // Must have more beans than unstaked amount
        require(stakedBalance[msg.sender].stakedAmount >= amount, "Insufficient funds.");
        if (queue.size() > 0) {
            PredictionQueue.Round memory currRound = queue.tail();
            bool isOwner = msg.sender == currRound.owner;
            bool ownerOfRound = isOwner && currRound.hasResolved;
            bool hasEnough = stakedBalance[msg.sender].stakedAmount - amount >= currRound.stakedAmount;
            require(!isOwner || (ownerOfRound && hasEnough), "Must have enough collateral for the current prediction round.");
        }

        // Transfer back staked to account
        beanContract.transfer(msg.sender, amount);
        
        if (amount == stakedBalance[msg.sender].stakedAmount) {
            // Reset staking balance to default value
            delete stakedBalance[msg.sender];
        } else {
            stakedBalance[msg.sender].stakedAmount -= amount;
        }
        totalStake -= amount;
    }

    function getAmountStake() view external returns(uint) {
        return stakedBalance[msg.sender].stakedAmount;
    }

    function getEarnSoFar() view external returns(uint) {
        return stakedBalance[msg.sender].earnSoFar;
    }

    function getPredictionRounds() view external returns(PredictionQueue.Round[] memory) {
        uint LENGTH_VIEW_LIMIT = 5;

        uint size = queue.size();
        uint limit = size < LENGTH_VIEW_LIMIT ? size : LENGTH_VIEW_LIMIT;

        PredictionQueue.Round[] memory limitedPredictions = new PredictionQueue.Round[](limit);
        for (uint i = 0; i < limit; i++) {
            limitedPredictions[i] = queue.tailAt(i);
        }
    
        return limitedPredictions;
    }

    function lockInPredict(uint amount, bool higher) external {
        require(stakedBalance[msg.sender].stakedAmount >= amount, "Insufficient funds.");
        uint price = getOraclePrice();
        require(price > 0, 'Invalid price on data feed');

        if (queue.size() > 0) {
            require(queue.tail().hasResolved, "Current round is still ongoing.");
        }

        PredictionQueue.Round memory newRound;
        newRound.roundNum = nextRoundNum;
        newRound.createdAt = block.timestamp;
        newRound.currPrice = price;
        newRound.stakedAmount = amount;
        newRound.isHigher = higher;
        newRound.owner = msg.sender;    //Single player (1 player = 1 round)
        newRound.outcome = PredictionQueue.Outcome.None;
        queue.enqueue(newRound);
        nextRoundNum++;
    }

    function resolve() external {
        require(queue.size() > 0, "Cannot resolve without any prediction.");
        PredictionQueue.Round memory currRound = queue.tail();
        require(block.timestamp - currRound.createdAt >= 10, "Try again in 10 seconds.");
        require(!currRound.hasResolved, "Round has already ended.");
        uint actualPrice = getOraclePrice();
        require(actualPrice > 0, 'Invalid price on data feed');
        address owner = currRound.owner;
        PredictionQueue.Outcome outcome;
        if (actualPrice != currRound.currPrice) {
            if (currRound.isHigher == actualPrice > currRound.currPrice) {//prediction and actual outcome match -> win
                uint reward = calculateReward(currRound.stakedAmount);
                beanContract.mint(address(this), reward);
                stakedBalance[owner].stakedAmount += reward;
                stakedBalance[owner].earnSoFar += reward;
                outcome = PredictionQueue.Outcome.Win;
            } else {
                stakedBalance[owner].stakedAmount -= currRound.stakedAmount;
                beansOnTheHouse += currRound.stakedAmount;
                outcome = PredictionQueue.Outcome.Lose;
            }
        } else {
            outcome = PredictionQueue.Outcome.Draw;
        }
        queue.resolveLatestRound(outcome, actualPrice);
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