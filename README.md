# Discrete Bean (BEAN) 
Explorer: https://sepolia.etherscan.io/address/0xc3db73C54ECf44a67eb3f12007fD6b5770e1D299

- Discrete Bean (BEAN) is an ERC20-token made for learning.
- Initial supply is 1 bean.
- BEANs can be placed in **Regular Farm** (staking) which will produce more beans.

# Regular Farm (Staking pool) 
Explorer: https://sepolia.etherscan.io/address/0xECb4ac66CEA2e69DB864D2951fE515C800e9C260

- Anyone can stake their beans.
- 1 bean rewarded for every minute the user has staked.
- Beans can be staked/unstaked at any time (no locked up period).
- Either entire balance of BEAN can be staked or none.
- If staking time is not whole minute. The floor is taken.
- Rewarded beans can be claimed without unstaking.
- Only the farm can generate (mint) more beans. No one else can do that.

# What I did

- Wrote an ERC20-standard smart contract 
- Wrote test case
- Connect contract to an RPC endpoint
- Deployed contract on

# What I learnt

- Writing tests in solidity is extremely important. Once a contract has been deployed, it remains on the blockchain forever so if a vulnerability/bug has been found, assets may have to be migrated to a new smart contract.

- Ignition modules allow you to keep track of what has been executed on the contract. Only new changes are detected and executed.

- Treat "already executed" steps as effectively permanent once deployed.

- Ignition deployed must be version controlled (i.e pushed onto git) https://hardhat.org/ignition/docs/guides/versioning.