import * as chai from "chai";
import { network } from "hardhat";
import chaiAsPromised from "chai-as-promised";
import type { DiscreteBean, RegularFarm } from "../types/ethers-contracts/index.js";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
chai.use(chaiAsPromised);
const { expect } = chai;
const { ethers, networkHelpers } = await network.create();

const SECONDS_PASSED = 60
const REWARDS_SHOULD_EARN = SECONDS_PASSED / 60;

async function deploySystem() {
    const [p1, p2, p3] = await ethers.getSigners();
    const bean = await ethers.deployContract("DiscreteBean");
    const farm = await ethers.deployContract("RegularFarm", [await bean.getAddress()]);

    await bean.transferOwnership(await farm.getAddress());
    return {bean, farm, p1, p2, p3}
}

async function stake(farm: RegularFarm, bean: DiscreteBean, staker: HardhatEthersSigner) {
    const farmAddr = await farm.getAddress();
    const balance = await bean.balanceOf(staker.address);
    await bean.approve(farmAddr, balance); //Allow farm to use p1's bean
    await farm.connect(staker).stake();
}

describe("RegularFarm", function () {

    it("Cannot init without args", async function() {
        expect(ethers.deployContract("RegularFarm")).to.be.rejected;
    })

    it("Can deploy system", async function() {
        expect(await deploySystem());
    })

    it("Initially, farm has no staked beans", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        expect(await bean.balanceOf(await farm.getAddress())).equals(0);
    })

    it("Staking ok + can see staked amount", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        expect(await bean.balanceOf(p1.address)).equals(3);

        await stake(farm, bean, p1);

        expect(await bean.balanceOf(p1.address)).equals(0);
        expect(await bean.balanceOf(await farm.getAddress())).equals(3);
        expect(await farm.connect(p1).getAmountStake()).equals(3)
    })

    it("Unstake ok", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        
        await stake(farm, bean, p1);

        expect(await bean.balanceOf(p1.address)).equals(0);
        expect(await bean.balanceOf(await farm.getAddress())).equals(3);
        expect(await farm.connect(p1).getAmountStake()).equals(3)

        await farm.connect(p1).unstake();

        expect(await bean.balanceOf(p1.address)).equals(3);
        expect(await bean.balanceOf(await farm.getAddress())).equals(0);
        expect(await farm.connect(p1).getAmountStake()).equals(0)     
    })

    it("Claim ok", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        
        
        await stake(farm, bean, p1);
        await networkHelpers.time.increase(SECONDS_PASSED);

        expect(await bean.balanceOf(p1.address)).equals(0);
        expect(await bean.totalSupply()).equals(3);

        await farm.connect(p1).claim()

        expect(await bean.balanceOf(p1.address)).equals(REWARDS_SHOULD_EARN);
        expect(await bean.totalSupply()).equals(3 + REWARDS_SHOULD_EARN);
    })

    it("Claim reward=0 if time is not over a minute", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        
        await stake(farm,bean,p1);
        expect(farm.connect(p1).claim()).to.be.revertedWith("No rewards to claim yet.");
    })
    
    it("Claim alone does not remove staked principal", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        
        await stake(farm,bean,p1);

        expect(await bean.balanceOf(p1.address)).equals(0);
        expect(await farm.connect(p1).getAmountStake()).equals(3)
        expect(await bean.balanceOf(await farm.getAddress())).equals(3);

        await networkHelpers.time.increase(SECONDS_PASSED);
        await farm.connect(p1).claim();   
        
        expect(await bean.balanceOf(p1.address)).equals(REWARDS_SHOULD_EARN);
        expect(await farm.connect(p1).getAmountStake()).equals(3)
        expect(await bean.balanceOf(await farm.getAddress())).equals(3);
    })

    it("Recent claim cannot be claimed before 1 minute", async function() {
        const {bean, farm, p1, p2, p3} = await deploySystem();
        
        await stake(farm,bean,p1);
        await networkHelpers.time.increase(SECONDS_PASSED);
        await farm.connect(p1).claim();

        expect(await bean.balanceOf(p1.address)).equals(REWARDS_SHOULD_EARN);
        expect(await bean.totalSupply()).equals(3 + REWARDS_SHOULD_EARN);

        expect(farm.connect(p1).claim()).to.be.revertedWith("No rewards to claim yet.");

        expect(await bean.balanceOf(p1.address)).equals(REWARDS_SHOULD_EARN);
        expect(await bean.totalSupply()).equals(3 + REWARDS_SHOULD_EARN);
    })
});
