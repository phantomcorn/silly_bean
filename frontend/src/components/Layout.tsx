import { NavLink, Outlet } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useContracts } from "../hooks/useContracts";
import { WalletConnect } from "./WalletConnect";
import type { AppOutletContext } from "../context";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  marginRight: 12,
  fontWeight: isActive ? "bold" : "normal",
});

export function Layout() {
  const wallet = useWallet();
  const contracts = useContracts(wallet.provider, wallet.signer);
  const context: AppOutletContext = { wallet, contracts };

  return (
    <main>
      <h1>Silly Beans</h1>

      <nav>
        <NavLink to="/" end style={navLinkStyle}>
          Home
        </NavLink>
        <NavLink to="/bean" style={navLinkStyle}>
          Bean
        </NavLink>
        <NavLink to="/farm" style={navLinkStyle}>
          Farm
        </NavLink>
        <NavLink to="/beanstalk" style={navLinkStyle}>
          Bean Stalk
        </NavLink>
      </nav>

      <WalletConnect {...wallet} />

      <Outlet context={context} />
    </main>
  );
}
