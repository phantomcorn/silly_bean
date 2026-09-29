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
const REFRESH_TIMEOUT = 10;

async function deploySystem() {
    const [p1, p2, p3] = await ethers.getSigners();
    const bean = await ethers.deployContract("DiscreteBean");
    const mockFeed = await ethers.deployContract("MockV3Aggregator", [0, 5000]); 
    const beanstalk = await ethers.deployContract("BeanStalk", [await bean.getAddress(), await mockFeed.getAddress()]);

    await byPassRefreshCooldown(beanstalk);
    await bean.setMinter(await beanstalk.getAddress()); //beanstalk can mint
    return {bean, beanstalk, mockFeed, p1, p2, p3}
}

async function byPassRefreshCooldown(beanstalk: BeanStalk) {
    await beanstalk.refresh() //update view price to whatever price feed is
    await networkHelpers.time.increase(REFRESH_TIMEOUT);
}

async function stake(beanstalk: BeanStalk, bean: DiscreteBean, staker: HardhatEthersSigner, amount: number) {
    const beanstalkAddr = await beanstalk.getAddress();
    const balance = await bean.balanceOf(staker.address);
    await bean.approve(beanstalkAddr, balance); //Allow beanstalk to use p1's bean
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

    it("Can use oracle network", async function() {
        const {beanstalk, mockFeed} = await deploySystem();

        expect(await beanstalk.getCurrPrice()).equals(5000);
        mockFeed.updateAnswer(3000); //update oracle network feed 
        expect(await beanstalk.getCurrPrice()).equals(5000); //should not update to datafeed unless refresh is called
        await beanstalk.refresh(); // should update to match oracle network feed
        expect(await beanstalk.getCurrPrice()).equals(3000);
    })

    it("Predict high when price increase should reward bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        const NEW_PRICE = 8000;

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getCurrPrice()).equals(5000); //user seeing 5000
        await mockFeed.updateAnswer(NEW_PRICE); //simulate price increase (user does not see this)

        //stakes 2 BEAN and predicts higher
        await beanstalk.predict(STAKE_AMOUNT, true); 

        const reward = STAKE_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);

        //should also update user-facing price
        expect(await beanstalk.getCurrPrice()).equals(NEW_PRICE);
    })

    it("Predict low when price decrease should reward bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        const NEW_PRICE = 3000;

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getCurrPrice()).equals(5000); //user seeing 5000
        await mockFeed.updateAnswer(NEW_PRICE); //simulate price increase (user does not see this)

        //stakes 2 BEAN and predicts lower
        await beanstalk.predict(STAKE_AMOUNT, false); 
        
        const reward = STAKE_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);

        //should also update user-facing price
        expect(await beanstalk.getCurrPrice()).equals(NEW_PRICE);
    })

    it("Price won't update before 10 sec has passed", async function () {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();

        expect(await beanstalk.refresh());
        expect(beanstalk.refresh()).to.be.revertedWith("Cannot refresh.");
    })

    it("Price updates every 10 sec", async function () {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        expect(await beanstalk.refresh());
        networkHelpers.time.increase(REFRESH_TIMEOUT);
        expect(await beanstalk.refresh());
    })

    it("Wrong prediction loses bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        const NEW_PRICE = 3000;
        const BET_AMOUNT = 1;

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await mockFeed.updateAnswer(NEW_PRICE); //simulate price increase (user does not see this)

        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getCurrPrice()).equals(5000); //user seeing 5000
        expect(await beanstalk.getBeansOnTheHouse()).equals(0);
        //stakes 2 BEAN and predicts higher
        await beanstalk.predict(BET_AMOUNT, true);

        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT - BET_AMOUNT);
        expect(await beanstalk.getBeansOnTheHouse()).equals(BET_AMOUNT);
        expect(await beanstalk.getCurrPrice()).equals(NEW_PRICE); //user seeing 5000
    })


    it("Cannot predict with more beans than staked amount", async function() {
        const {bean, beanstalk, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        await expect(beanstalk.predict(STAKE_AMOUNT + 1, true)).to.be.revertedWith("Insufficient funds.");
    })
});
