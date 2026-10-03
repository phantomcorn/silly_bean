import * as chai from "chai";
import { network } from "hardhat";
import chaiAsPromised from "chai-as-promised";
import type { DiscreteBean, BeanStalk } from "../types/ethers-contracts/index.js";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
chai.use(chaiAsPromised);
const { expect } = chai;
const { ethers, networkHelpers } = await network.create();

const Outcome = { //Mirrors PredictionQueue.Outcome enum
    None: 0,
    Win: 1,
    Draw: 2,
    Lose: 3
}

const BET_AMOUNT = 1;
const STAKE_AMOUNT = 2;
const REWARD_MULTIPLIER = 2;
const CAN_RESOLVE_AFTER = 10;
const ORIGINAL_PRICE = 5000;
const ROUND_SIZE_LIMIT = 5;
const INVALID_PRICE = 0

async function deploySystem() {
    const [p1, p2, p3] = await ethers.getSigners();
    const bean = await ethers.deployContract("DiscreteBean");
    const mockFeed = await ethers.deployContract("MockV3Aggregator", [0, ORIGINAL_PRICE]); 
    const beanstalk = await ethers.deployContract("BeanStalk", [await bean.getAddress(), await mockFeed.getAddress()]);
    
    await bean.connect(p1).claimFreeBean();
    await bean.connect(p2).claimFreeBean();
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
        expect(await beanstalk.beansOnTheHouse()).equals(0);
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

    it("Staking twice accumulates staked amount", async function() {
        const {bean, beanstalk, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, 1);
        expect(await beanstalk.getAmountStake()).equals(1);
        await stake(beanstalk, bean, p1, 1);
        expect(await beanstalk.getAmountStake()).equals(2);
    });


    it("Staking twice keeps contract balance equal to total staked", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        const beanstalkAddr = await beanstalk.getAddress()

        expect(await bean.balanceOf(beanstalkAddr)).equals(await beanstalk.totalStake());

        await stake(beanstalk, bean, p1, 1);
        await stake(beanstalk, bean, p1, 1);
        
        expect(await bean.balanceOf(beanstalkAddr)).equals(await beanstalk.totalStake())
    });

    it("Multiple stakers: contract balance equals sum of all stakes", async function() {
        const {bean, beanstalk, p1, p2} = await deploySystem();
        const beanstalkAddr = await beanstalk.getAddress();

        expect(await bean.balanceOf(beanstalkAddr)).equals(await beanstalk.totalStake());

        await stake(beanstalk, bean, p1, 1); //p1 stake
        await stake(beanstalk, bean, p2, 1); //p2 stake
        
        expect(await bean.balanceOf(beanstalkAddr)).equals(await beanstalk.totalStake())
    });

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

    it("The person predicting is the owner of that prediction round", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        expect((await beanstalk.getPredictionRounds()).length).equals(0);
        await beanstalk.lockInPredict(BET_AMOUNT, true);

        const predictions = await beanstalk.getPredictionRounds();
        expect(predictions.length).equals(1);
        expect(predictions[0].owner).equals(p1.address)
    })

    it("Can make prediction and view", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        expect((await beanstalk.getPredictionRounds()).length).equals(0);
        await beanstalk.lockInPredict(BET_AMOUNT, true);

        const predictions = await beanstalk.getPredictionRounds();
        expect(predictions.length).equals(1);
        expect(predictions[0].roundNum).equals(1)
        expect(predictions[0].hasResolved).equals(false);
        expect(predictions[0].stakedAmount).equals(BET_AMOUNT);
        expect(predictions[0].currPrice).equals(ORIGINAL_PRICE);
        expect(predictions[0].outcome).equals(Outcome.None);
    })

    it("Can view up to 5 latest round", async function () {
        const {beanstalk, bean, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        for (let i = 0; i < ROUND_SIZE_LIMIT + 1; i++) {
            await beanstalk.lockInPredict(BET_AMOUNT, true);
            await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
            await beanstalk.resolve();
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

        await beanstalk.lockInPredict(BET_AMOUNT, false); 
        
        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false)
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(true)
    })

    it("Cannot resolve if called before 10 seconds of lockInPredict", async function () {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); 

        await expect(beanstalk.resolve()).to.be.revertedWith("Try again in 10 seconds.");
    })

    it("Cannot resolve an already resolved prediction round", async function () {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        await beanstalk.lockInPredict(BET_AMOUNT, false); 
        networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(true);
        await expect(beanstalk.resolve()).to.revertedWith("Round has already ended.");
    })

    it("Cannot lock in prediction when oracle price is zero", async function() {
        const {bean, beanstalk, p1, mockFeed} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await mockFeed.updateAnswer(INVALID_PRICE);

        await expect(beanstalk.lockInPredict(BET_AMOUNT, true)).to.be.revertedWith("Invalid price on data feed");
    });

    it("Cannot resolve when oracle price is zero", async function() {
        const {bean, beanstalk, p1, mockFeed} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, true);
        await mockFeed.updateAnswer(INVALID_PRICE);
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await expect(beanstalk.resolve()).to.be.revertedWith("Invalid price on data feed");
    });

    it("Cannot lock in more prediction without resolving the current one", async function() {
        const {bean, beanstalk, p1, mockFeed} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        
        await beanstalk.lockInPredict(BET_AMOUNT, true);
        await expect(beanstalk.lockInPredict(BET_AMOUNT, true)).to.be.revertedWith("Current round is still ongoing.");
    });

    it("Unresolved round ending price is zero", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(BET_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false);
        expect((await beanstalk.getPredictionRounds())[0].endingPrice).equals(0);
    })

    it("Unresolved round has outcome as None", async function() { 
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(BET_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false);
        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.None);
    })

    it("Won round has correct flag as Win", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(BET_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.None);

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.Win);
    })

    it("Draw round has correct flag as Draw", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(BET_AMOUNT, true); 

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.None);

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.Draw);
    })

    it("Resolved round ending price is data feed price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts higher
        await beanstalk.lockInPredict(BET_AMOUNT, true); 
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
        await beanstalk.lockInPredict(BET_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)
        
        expect(await beanstalk.getEarnSoFar()).equals(0);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER)
        await beanstalk.resolve();

        const reward = BET_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);
    })

    it("Predict low when price decrease should reward bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        //lock in prediction of 2 BEAN and predicts lower
        await beanstalk.lockInPredict(BET_AMOUNT, false); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE - 3000); //simulate price decrease (user does not see this)
        
        expect(await beanstalk.getEarnSoFar()).equals(0);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER)
        await beanstalk.resolve();

        const reward = BET_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);
    })

    it("Wrong prediction loses bean and update price", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.beansOnTheHouse()).equals(0);

        //stakes 2 BEAN and predicts higher
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT - BET_AMOUNT);
        expect(await beanstalk.beansOnTheHouse()).equals(BET_AMOUNT);
    })

    it("A draw resolves the round and nothing happens to the user balance", async function() {
        const {bean, beanstalk, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false);

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.None);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getEarnSoFar()).equals(0);
        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false)

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.Draw);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getEarnSoFar()).equals(0);
        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(true)
    })

    it("Unchanged price counts as a draw for lower prediction", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);

        await beanstalk.lockInPredict(BET_AMOUNT, false);
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.Draw);
    });

    it("Unchanged price counts as a draw for higher prediction", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        
        await beanstalk.lockInPredict(BET_AMOUNT, true);
        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.resolve();

        expect((await beanstalk.getPredictionRounds())[0].outcome).equals(Outcome.Draw);
    });

    it("Winning reward goes to the player who made the prediction", async function() {
        const {bean, beanstalk, mockFeed, p1, p2} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, true); 
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].owner).equals(p1.address);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);
        expect(await beanstalk.getEarnSoFar()).equals(0);     

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.connect(p2).resolve(); //e.g backend script called resolve

        const reward = BET_AMOUNT * REWARD_MULTIPLIER
        expect(await beanstalk.getEarnSoFar()).equals(reward);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT + reward);
    });

    it("Cannot unstake beans that are locked in an unresolved prediction", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        await expect(beanstalk.unstake(STAKE_AMOUNT)).to.be.revertedWith("Must have enough collateral for the current prediction round.");
    });

    it("Losing round deducts from the player who made the prediction, not the resolver", async function() {
        const {bean, beanstalk, mockFeed, p1, p2} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect((await beanstalk.getPredictionRounds())[0].owner).equals(p1.address);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT);

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.connect(p2).resolve(); //e.g backend script called resolve

        expect((await beanstalk.getPredictionRounds())[0].owner).equals(p1.address);
        expect(await beanstalk.getAmountStake()).equals(STAKE_AMOUNT - BET_AMOUNT);
    });


    it("Losing round can be resolved even if the resolver has no stake", async function() {
        const {bean, beanstalk, mockFeed, p1, p2} = await deploySystem();
        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        expect(await beanstalk.connect(p2).getAmountStake()).equals(0);
        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(false);   

        await networkHelpers.time.increase(CAN_RESOLVE_AFTER);
        await beanstalk.connect(p2).resolve(); //e.g backend script called resolve

        expect((await beanstalk.getPredictionRounds())[0].hasResolved).equals(true);
    });


    it("Losing round cannot be dodged by unstaking before resolve", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        await expect(beanstalk.unstake(STAKE_AMOUNT)).to.be.revertedWith("Must have enough collateral for the current prediction round.");
    });

    it("Losing prediction cannot be abandoned by making a new prediction", async function() {
        const {bean, beanstalk, mockFeed, p1} = await deploySystem();

        await stake(beanstalk, bean, p1, STAKE_AMOUNT);
        await beanstalk.lockInPredict(BET_AMOUNT, false); //predicts decrease -> will predict incorrectly
        await mockFeed.updateAnswer(ORIGINAL_PRICE + 3000); //simulate price increase (user does not see this)

        await expect(beanstalk.lockInPredict(BET_AMOUNT, true)).to.be.revertedWith("Current round is still ongoing.")
    });

    it("Another player's prediction does not block resolving my round", async function() {
        //This is a TBC feature since currently if the current round has not ended.
        //Additional lockInPredict will revert.
    });
    it("Outcome does not depend on when resolve is called after the waiting period", async function() {
        //Should pass automatically, backend calling resolve will always resolve at a fixed rate.
    });
    it("Cannot wait for a favourable price before resolving", async function() {
        //Should pass automatically, backend calling resolve will always resolve at a fixed rate.
    });
});
