# Overview

ERC-20 smart contract with ability to stake built for learning purpose.

Token (Discrete Bean): https://sepolia.etherscan.io/address/0x9f2B1530F67f1f4FF8A94bDCcBc07F6aC8689cA2

Staking pool (Regular Farm): https://sepolia.etherscan.io/address/0x92b7395188042CC13B7c967f7Eed9295Cf1D803D

Prediction market (BeanStalk): https://sepolia.etherscan.io/address/0x4Bc2656660cE7CE8D267f20591dC07B575Bc6474

# Discrete Bean (Token)

- Discrete Bean (BEAN) is an ERC-20 token.
- Initial supply is 3 BEAN.
- BEANs can be placed in Regular Farm (staking pool) which will mint more beans.

# Regular Farm (Staking pool) 

- Anyone can stake their beans.
- 1 BEAN rewarded for every minute the user has staked.
- BEANs can be staked/unstaked at any time (no locked up period).
- Either entire balance of BEAN can be staked or none.
- If staking time is not whole minute. The floor is taken.
- Rewarded BEAN can be claimed without unstaking.
- The farm **can** generate (mint) more beans. 

# Bean Stalk (Prediction Market)

- Any BEAN holders can stake.
- Given recent ETH/USD, predicts whether the current price is higher/lower than the current one.
- Price will update every 10 seconds or once the user predicts.
- Uses an oracle network to look up the price of ETH/USD.
- If guess is correct, a multiplier is used to reward more BEANs.
- If guess is wrong, holders lose their BEAN to the house.
- Bean Stalk **can** generate (mint) more beans. 

# What I did

- Wrote an ERC20-standard smart contract 
- Wrote basic staking pool contract with fixed reward rate
- Wrote basic prediction market contract to predict high/lower from current price pulled from a data feed (single player).
- Wrote test cases for robustness
- Connect contract to an RPC endpoint
- Deployed contract on Ethereum Sepolia testnet
- Verified contract source code on Etherscan, Blockscout, and Sourcify
- Upgraded BEAN from Ownable to Access Control-based role so both farm and bean stalk can mint more beans.
- Test oracle network integration by mocking data feed
- Simulate time by mocking

# Challenges

### Problem 1
Every 10 second, a signature is required to update ETH/USD price. This is not ideal if the user has to sign the transaction everytime.

Solution 1: Backend cron job which signs and update the ETH/USD price. 

Problem with this is you are spending gas fees every 10 sec.

Solution 2: Remodelled the game as a Lock-in prediction -> wait window time -> Resolve prediction rather than a One-click predict-reward.

User has to wait a certain period of time before they know the outcome

We went for the 2nd solution since this is the standard ([PancakeSwap's Up/Down game](https://pancakeswap.finance/prediction?token=ETH))

# What I learnt

- Writing tests in solidity is extremely important. Once a contract has been deployed, it remains on the blockchain forever so if a vulnerability/bug has been found, assets may have to be migrated to a new smart contract.

- Ignition modules allow you to keep track of what has been executed on the contract. Only new changes are detected and executed.

- Treat "already executed" steps as effectively permanent once deployed.

- Ignition deployments must be version controlled. (i.e pushed onto git) https://hardhat.org/ignition/docs/guides/versioning.

- Access Control gives a finer control on who has access to what function.
- Access Control `DEFAULT_ADMIN_ROLE` does not grant power to all function (not equal to owner).
