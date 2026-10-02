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
    "0x2cF60F3fAeB5043bfc9d16260043F860c6838026",
} as const;

export const ETH_USD_PRICE_FEED_ADDRESS =
  "0x694AA1769357215DE4FAC081bf1f309aDC325306";
