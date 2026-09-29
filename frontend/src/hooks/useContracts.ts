import { useMemo } from "react";
import { Contract, type BrowserProvider, type JsonRpcSigner } from "ethers";
import { DiscreteBeanAbi } from "../abis/DiscreteBean";
import { RegularFarmAbi } from "../abis/RegularFarm";
import { BeanStalkAbi } from "../abis/BeanStalk";
import { CONTRACT_ADDRESSES } from "../config/contracts";

export function useContracts(
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null,
) {
  return useMemo(() => {
    const runner = signer ?? provider;
    if (!runner) {
      return { discreteBean: null, regularFarm: null, beanStalk: null };
    }
    return {
      discreteBean: new Contract(
        CONTRACT_ADDRESSES.discreteBean,
        DiscreteBeanAbi,
        runner,
      ),
      regularFarm: new Contract(
        CONTRACT_ADDRESSES.regularFarm,
        RegularFarmAbi,
        runner,
      ),
      beanStalk: new Contract(
        CONTRACT_ADDRESSES.beanStalk,
        BeanStalkAbi,
        runner,
      ),
    };
  }, [provider, signer]);
}
