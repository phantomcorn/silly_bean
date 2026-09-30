// Sepolia testnet deployment (backend/ignition/deployments/chain-11155111/deployed_addresses.json)
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const CONTRACT_ADDRESSES = {
  discreteBean:
    import.meta.env.VITE_DISCRETE_BEAN_ADDRESS ??
    "0x9f2B1530F67f1f4FF8A94bDCcBc07F6aC8689cA2",
  regularFarm:
    import.meta.env.VITE_REGULAR_FARM_ADDRESS ??
    "0x92b7395188042CC13B7c967f7Eed9295Cf1D803D",
  beanStalk:
    import.meta.env.VITE_BEAN_STALK_ADDRESS ??
    "0x4Bc2656660cE7CE8D267f20591dC07B575Bc6474",
} as const;

export const ETH_USD_PRICE_FEED_ADDRESS =
  "0x694AA1769357215DE4FAC081bf1f309aDC325306";
