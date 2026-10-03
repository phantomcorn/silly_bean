// Sepolia testnet deployment (backend/ignition/deployments/chain-11155111/deployed_addresses.json)
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const CONTRACT_ADDRESSES = {
  discreteBean:
    import.meta.env.VITE_DISCRETE_BEAN_ADDRESS ??
    "0x8e8e07ca4179Bc1fFb35e79Ab71ab7EEAe334Cf4",
  regularFarm:
    import.meta.env.VITE_REGULAR_FARM_ADDRESS ??
    "0xe49bba42f5AF5Fb6d82DDFa7ad75DBEAde34Fa97",
  beanStalk:
    import.meta.env.VITE_BEAN_STALK_ADDRESS ??
    "0x7B378D7d9E294548907eC919a9d5deE99F133Ede",
} as const;

export const ETH_USD_PRICE_FEED_ADDRESS =
  "0x694AA1769357215DE4FAC081bf1f309aDC325306";
