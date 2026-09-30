// Sepolia testnet deployment (backend/ignition/deployments/chain-11155111/deployed_addresses.json)
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const CONTRACT_ADDRESSES = {
  discreteBean:
    import.meta.env.VITE_DISCRETE_BEAN_ADDRESS ??
    "0xb878d053c85cBAaf70B6104B9D77db919777B8aA",
  regularFarm:
    import.meta.env.VITE_REGULAR_FARM_ADDRESS ??
    "0x76F6f261Ab8F6CA05C10482F7229BaeFdAD30025",
  beanStalk:
    import.meta.env.VITE_BEAN_STALK_ADDRESS ??
    "0x2d0e34bb6D0Aa0767495d0BF52cC79E965e79E3A",
} as const;

export const ETH_USD_PRICE_FEED_ADDRESS =
  "0x694AA1769357215DE4FAC081bf1f309aDC325306";
