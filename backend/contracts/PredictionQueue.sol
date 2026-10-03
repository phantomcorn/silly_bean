// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PredictionQueue {

    enum Outcome {None, Win, Draw, Lose} //None = 0, Win = 1, Draw = 2, Lose = 3
    struct Round {
        address owner;
        uint roundNum;
        bool hasResolved;
        uint stakedAmount;
        uint currPrice;
        uint createdAt;
        bool isHigher;
        uint endingPrice; //initially 0
        Outcome outcome; //initially Outcome.None
    }

    address private immutable owner;
    mapping(uint => Round) predictionRounds;
    uint private front;
    uint private back;
    uint private SIZE_OF_QUEUE = 20;

    event RoundEnqueued(uint roundNum);
    event RoundDequeued(uint roundNum);

    constructor() {
        front = 0; //front of queue [front.....back]
        back = 0;  //back of queue
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notEmpty() {
        require(size() > 0, "Empty");
        _;
    }

    function enqueue(Round memory predictionRound) external onlyOwner {
        if (size() == SIZE_OF_QUEUE) {
            dequeue();
        }
        //add to back of queue
        predictionRounds[back] = predictionRound;
        back++;
        emit RoundEnqueued(predictionRound.roundNum);
    }

    function dequeue() public onlyOwner notEmpty {
        Round memory result = predictionRounds[front];
        delete predictionRounds[front];
        front++;
        emit RoundDequeued(result.roundNum);
    }

    function size() public view onlyOwner returns(uint) {
        return back - front;
    }


    function tail() external view onlyOwner notEmpty returns(Round memory) {
        return predictionRounds[back - 1];
    }

    function tailAt(uint position) external view onlyOwner notEmpty returns(Round memory)  { 
        //position is relative from the back i.e position=0 returns last, position=1 returns the second last, ...
        require(position < size(), "Out of bounds");
        return predictionRounds[back - 1 - position];
    }

    function resolveLatestRound(Outcome outcome, uint actualPrice) external onlyOwner notEmpty{
        Round storage currRound = predictionRounds[back - 1];
        currRound.endingPrice = actualPrice;
        currRound.hasResolved = true;
        currRound.outcome = outcome;
    }
}