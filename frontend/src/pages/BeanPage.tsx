import { useOutletContext } from "react-router-dom";
import { BeanTokenPanel } from "../components/BeanTokenPanel";
import type { AppOutletContext } from "../context";

export function BeanPage() {
  const { wallet, contracts } = useOutletContext<AppOutletContext>();

  return (
    <BeanTokenPanel
      discreteBean={contracts.discreteBean}
      address={wallet.address}
    />
  );
}
