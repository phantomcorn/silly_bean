import { useOutletContext } from "react-router-dom";
import { RegularFarmPanel } from "../components/RegularFarmPanel";
import type { AppOutletContext } from "../context";

export function FarmPage() {
  const { wallet, contracts } = useOutletContext<AppOutletContext>();

  return (
    <RegularFarmPanel
      discreteBean={contracts.discreteBean}
      regularFarm={contracts.regularFarm}
      address={wallet.address}
    />
  );
}
