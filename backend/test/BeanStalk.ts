import * as chai from "chai";
import { network } from "hardhat";
import chaiAsPromised from "chai-as-promised";
import type { DiscreteBean, BeanStalk } from "../types/ethers-contracts/index.js";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
chai.use(chaiAsPromised);
const { expect } = chai;
const { ethers, networkHelpers } = await network.create();

const STAKE_AMOUNT = 2;
const REWARD_MULTIPLIER = 2;
const CAN_RESOLVE_AFTER = 10;
const ORIGINAL_PRICE = 5000;
const ROUND_SIZE_LIMIT = 5;

async function deploySystem() {
    const [p1, p2, p3] = await ethers.getSigners();
    const bean = await ethers.deployContract("DiscreteBean");
    const mockFeed = await ethers.deployContract("MockV3Aggregator", [0, ORIGINAL_PRICE]); 
    const beanstalk = await ethers.deployContract("BeanStalk", [await bean.getAddress(), await mockFeed.getAddress()]);
    
    await bean.claimFreeBean();
    await bean.setMinter(await beanstalk.getAddress()); //beanstalk can mint
    return {bean, beanstalk, mockFeed, p1, p2, p3}
}

async function stake(beanstalk: BeanStalk, bean: DiscreteBean, staker: HardhatEthersSigner, amount: number) {
    const beanstalkAddr = await beanstalk.getAddress();
    const balance = await bean.balanceOf(staker.address);
    await bean.connect(staker).approve(beanstalkAddr, balance); //Allow beanstalk to use staker's bean
    await beanstalk.connect(staker).stake(amount);
}

describe("BeanStalk", function () {

    it("Cannot init without args", async function() {
        expect(ethers.deployContract("BeanStalk")).to.be.rejected;
    })

    it("Can deploy system", async function() {
        expect(await deploySystem());
    })

    it("Can see rewards earned so far", async function() {
        const {bean, beanstalk} = await deploySystem();
        expect(await beanstalk.getEarnSoFar()).equals(0);
    })

    it("Can see beans on the house", async function() {
        const {bean, beanstalk} = await deploySystem();
        expect(await beanstalk.getBeansOnTheHouse()).equals(0);
    })

    it("Can get oracle decimals", async function () {
        const {beanstalk} = await deploySystem();
        expect(await beanstalk.getOracleDecimals()).equals(0);
    })


    it("Initially, BeanStalk has no staked beans", async function() {
        const {bean, beanstalk} = await deploySystem();
        expect(await bean.balanceOf(await beanstalk.getAddress())).equals(0);
    })

    it("Staking ok + can see staked amount", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        expect(await bean.balanceOf(p1.address)).equals(3);

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        expect(await bean.balanceOf(p1.address)).equals(1);
        expect(await bean.balanceOf(await beanstalk.getAddress())).equals(2);
        expect(await beanstalk.connect(p1).getAmountStake()).equals(2)
    })

    it("Unstake ok", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        expect(await bean.balanceOf(p1.address)).equals(1);
        expect(await bean.balanceOf(await beanstalk.getAddress())).equals(2);
        expect(await beanstalk.connect(p1).getAmountStake()).equals(2)

        await beanstalk.connect(p1).unstake(STAKE_AMOUNT);

        expect(await bean.balanceOf(p1.address)).equals(3);
        expect(await bean.balanceOf(await beanstalk.getAddress())).equals(0);
        expect(await beanstalk.connect(p1).getAmountStake()).equals(0)     
    })

    it("Cannot resolve without any prediction", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        expect((await beanstalk.getPredictionRounds()).length).equals(0);
        await expect(beanstalk.resolve()).to.be.revertedWith("Cannot resolve without any prediction.");
    })

    it("Can make prediction and view", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        expect((await beanstalk.getPredictionRounds()).length).equals(0);
        await beanstalk.lockInPredict(STAKE_AMOUNT, true);

        const predictions = await beanstalk.getPredictionRounds();
        expect(predictions.length).equals(1);
        expect(predictions[0].roundNum).equals(1)
        expect(predictions[0].hasResolved).equals(false);
        expect(predictions[0].stakedAmount).equals(2);
        expect(predictions[0].currPrice).equals(ORIGINAL_PRICE);
        expect(predictions[0].correct).equals(false);
    })

    it("Can view up to 5 latest round", async function () {
        const {beanstalk, bean, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        for (let i = 0; i < ROUND_SIZE_LIMIT + 1; i++) {
            await beanstalk.lockInPredict(STAKE_AMOUNT, true);
        }
        expect((await beanstalk.getPredictionRounds()).length).equals(ROUND_SIZE_LIMIT);
    })

    it("Can lock in prediction with enough funds", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        await beanstalk.lockInPredict(STAKE_AMOUNT, true); 
    })

    it("Cannot lock in prediction without enough funds", async function() {
        const {bean, beanstalk, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        await expect(beanstalk.lockInPredict(STAKE_AMOUNT + 1, true)).to.be.revertedWith("Insufficient funds.");
    })

    it("Can be resolved if called after 10 seconds of lockInPredict", async function () {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        await beanstalk.lockInPredict(STAKE_AMOUNT, false); 
        
        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false)
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(true)
    })

    it("Cannot resolve if called before 10 seconds of lockInPredict", async function () {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(STAKE_AMOUNT, false); 

        expect(beanstalk.resolve()).to.be.revertedWith("Try again in 10 seconds.");
    })

    it("Cannot resolve an already resolved prediction round", async function () {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        await beanstalk.lockInPredict(STAKE_AMOUNT, false); 
        networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(true);
        expect(beanstalk.resolve()).to.revertedWith("Round has already ended.");
    })

    it("Unresolved round ending price is zero", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(STAKE_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false);
        expect((await beanstalk.getPredictionRounds())[0].endingPrice).equals(0);
    })

    it("Unresolved round has correct flag as false", async function() { 
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(STAKE_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false);
        expect((await beanstalk.getPredictionRounds())[0].correct).equals(false);
    })

    it("Won round has correct flag as true", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(STAKE_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].correct).equals(false);

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].correct).equals(true);
    })

    it("Resolved round ending price is data feed price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(STAKE_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].endingPrice).equals(0);

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].endingPrice).equals(ORIGINAL_PRICE + 3000);
    })

    it("Predict high when price increase should reward bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(STAKE_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)
        
        expect(await beanstalk.getEarnSoFar()).equals(0);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER)
        await beanstalk.resolve();

        const reward = STAKE_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);
    })

    it("Predict low when price decrease should reward bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts lower
        await beanstalk.lockInPredict(STAKE_AMOUNT, false); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE - 3000); //simulate price decrease (user does not see this)
        
        expect(await beanstalk.getEarnSoFar()).equals(0);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER)
        await beanstalk.resolve();

        const reward = STAKE_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);
    })

    it("Wrong prediction loses bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        const BET_AMOUNT = 1;

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getBeansOnTheHouse()).equals(0);

        //stakes 2 BEAN and predicts higher
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT - BET_AMOUNT);
        expect(await beanstalk.getBeansOnTheHouse()).equals(BET_AMOUNT);
    })

});
