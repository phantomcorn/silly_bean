import { useOutletContext } from "react-router-dom";
import { BeanStalkPanel } from "../components/BeanStalkPanel";
import type { AppOutletContext } from "../context";

export function BeanStalkPage() {
  const { wallet, contracts } = useOutletContext<AppOutletContext>();

  return (
    <BeanStalkPanel
      discreteBean={contracts.discreteBean}
      beanStalk={contracts.beanStalk}
      address={wallet.address}
    />
  );
}
