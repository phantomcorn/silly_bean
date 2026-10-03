import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.create();
import type { PredictionQueue } from "../types/ethers-contracts/index.js";

const Outcome = { //Mirrors PredictionQueue.Outcome enum
    None: 0,
    Win: 1,
    Draw: 2,
    Lose: 3
}

const ROUND = {
    roundNum: 1,
    hasResolved: false,
    stakedAmount: 1,
    currPrice: 0,
    createdAt: Date.now(),
    isHigher: false,
    endingPrice: 0,
    correct: false,
    owner: ethers.ZeroAddress,
    outcome: Outcome.None
}


const NORMAL_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
const SHUFFLE_ORDER = [7, 15, 2, 19, 11, 4, 20, 1, 13, 9, 17, 6, 3, 14, 10, 18, 5, 12, 16, 8]

async function deploySystem() {
    const queue = await ethers.deployContract("PredictionQueue");
    const [p1, p2, p3] = await ethers.getSigners();

    return {p1, p2, p3, queue};
}

async function queueToMaxCapacity(queue: PredictionQueue, order: number[]) {
    for (let i = 0; i < order.length; i++) {
        const newRound = {...ROUND, roundNum: order[i]};
        await queue.enqueue(newRound);
    }
}

describe("PredictionQueue", function () {

    it("Can init queue", async function () {
        expect(ethers.deployContract("PredictionQueue"));
    })

    it("Only owner can interact with queue", async function () {
        const queueContract = await ethers.getContractFactory("PredictionQueue");
        const [owner, nonOwner] = await ethers.getSigners();

        const queue = await queueContract.connect(owner).deploy();
        
        expect(await queue.connect(owner).enqueue(ROUND));
        expect(await queue.connect(owner).tail());
        expect(await queue.connect(owner).tailAt(0));
        expect(await queue.connect(owner).resolveLatestRound(Outcome.Win, 0));
        expect(await queue.connect(owner).size());
        expect(await queue.connect(owner).dequeue());

        await expect(queue.connect(nonOwner).enqueue(ROUND)).to.be.revertedWith("Not owner");
        await expect(queue.connect(nonOwner).tail()).to.be.revertedWith("Not owner");
        await expect(queue.connect(nonOwner).tailAt(0)).to.be.revertedWith("Not owner");
        await expect(queue.connect(nonOwner).resolveLatestRound(Outcome.Win, 0)).to.be.revertedWith("Not owner");
        await expect(queue.connect(nonOwner).size()).to.be.revertedWith("Not owner");
        await expect(queue.connect(nonOwner).dequeue()).to.be.revertedWith("Not owner");
    })

    it("Size of empty queue is 0", async function () {
        const {queue, p1} = await deploySystem();
        expect(await queue.size()).equals(0);
    })

    it("Enqueue increase size by 1", async function () {
        const {queue} = await deploySystem();
        expect(await queue.size()).equals(0);
        await queue.enqueue(ROUND);
        expect(await queue.size()).equals(1);
    })

    it("Dequeue decrease size by 1", async function () {
        const {queue} = await deploySystem();
        await queue.enqueue(ROUND);
        expect(await queue.size()).equals(1);
        await queue.dequeue();
        expect(await queue.size()).equals(0);
    })

    it("Enqueue emits RoundEnqueued event", async function () {
        const {queue} = await deploySystem();
        await expect(queue.enqueue(ROUND))
            .to.emit(queue, "RoundEnqueued")
            .withArgs(ROUND.roundNum);
    })

    it("Dequeue emits RoundDequeued event", async function () {
        const {queue} = await deploySystem();
        await queue.enqueue(ROUND);
        await expect(queue.dequeue(ROUND))
            .to.emit(queue, "RoundDequeued")
            .withArgs(ROUND.roundNum);
    })

    it("Cannot dequeue empty queue", async function() {
        const {queue} = await deploySystem();
        await expect(queue.dequeue()).to.be.revertedWith("Empty");
    })

    it("Cannot tail empty queue", async function() {
        const {queue} = await deploySystem();
        await expect(queue.tail()).to.be.revertedWith("Empty");
    })
    
    it("Cannot tailAt empty queue", async function() {
        const {queue} = await deploySystem();
        await expect(queue.tailAt(0)).to.be.revertedWith("Empty");
    })

    it("Cannot resolveLatestRound empty queue", async function() {
        const {queue} = await deploySystem();
        await expect(queue.resolveLatestRound(Outcome.Draw, 0)).to.be.revertedWith("Empty");
    })

    it("resolveLatestRound resolves the latest round", async function() {
        const {queue} = await deploySystem();
        for (let i = 0; i < 20; i++) {
            const newRound = {...ROUND, roundNum: i + 1};
            await queue.enqueue(newRound);
        }

        expect((await queue.tail()).roundNum).equals(20);
        expect((await queue.tail()).hasResolved).equals(ROUND.hasResolved);
        expect((await queue.tail()).outcome).equals(ROUND.outcome);
        expect((await queue.tail()).endingPrice).equals(ROUND.endingPrice);

        const newCorrect = Outcome.Win
        const endingPrice = 1000;

        await queue.resolveLatestRound(newCorrect, endingPrice);
        expect((await queue.tail()).roundNum).equals(20);
        expect((await queue.tail()).hasResolved).equals(true);
        expect((await queue.tail()).outcome).equals(newCorrect);
        expect((await queue.tail()).endingPrice).equals(endingPrice);
    })

    it("Queue preserves order", async function() {
        const {queue} = await deploySystem();
        await queueToMaxCapacity(queue, NORMAL_ORDER);

        for (let i = 0; i < 20; i++) {
            await expect(queue.dequeue(ROUND))
                .to.emit(queue, "RoundDequeued")
                .withArgs(i);
        }
    })

    it("tail retrieves the last item pushed", async function() {
        const {queue} = await deploySystem();
        await queueToMaxCapacity(queue, NORMAL_ORDER);
        expect((await queue.tail()).roundNum).equals(NORMAL_ORDER[NORMAL_ORDER.length - 1]);
    })

    it("tailAt retrieves the nth element from the back", async function () {
        const {queue} = await deploySystem();
        await queueToMaxCapacity(queue, NORMAL_ORDER);

        const lastIdx = NORMAL_ORDER.length - 1;
        for (let i = 0; i < NORMAL_ORDER.length; i++) {
            //tailAt(0) -> last item -> 20
            //tailAt(1) -> second last item -> 19
            //...
            //tailAt(n) -> nth last time -> 20 - n
            expect((await queue.tailAt(i)).roundNum).equals(NORMAL_ORDER[lastIdx - i]);
        }
    })

    it("Queue can never exceed 20, will remove oldest item first", async function () {
        const {queue} = await deploySystem();
        //front=7 back=8
        const order = SHUFFLE_ORDER;
        const maxSize = SHUFFLE_ORDER.length;
        await queueToMaxCapacity(queue, SHUFFLE_ORDER);

        const newRoundNum = 99;
        order.push(newRoundNum)
        order.shift();
        // 7 <- [15, 2, 19, 11, 4, 20, 1, 13, 9, 17, 6, 3, 14, 10, 18, 5, 12, 16, 8] <- 99
        
        expect(await queue.size()).equals(maxSize);
        await queue.enqueue({...ROUND, roundNum: newRoundNum});
        expect(await queue.size()).equals(maxSize);

        for (let i = 0; i < maxSize; i++) {
            await expect(queue.dequeue(ROUND))
                .to.emit(queue, "RoundDequeued")
                .withArgs(order[i]);
        }

    })
});
