import type { useWallet } from "./hooks/useWallet";
import type { useContracts } from "./hooks/useContracts";

export interface AppOutletContext {
  wallet: ReturnType<typeof useWallet>;
  contracts: ReturnType<typeof useContracts>;
}
