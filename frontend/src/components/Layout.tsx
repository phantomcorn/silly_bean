import { Link, NavLink, Outlet } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useContracts } from "../hooks/useContracts";
import { WalletConnect } from "./WalletConnect";
import { Bean } from "./Bean";
import type { AppOutletContext } from "../context";

export function Layout() {
  const wallet = useWallet();
  const contracts = useContracts(wallet.provider, wallet.signer);
  const context: AppOutletContext = { wallet, contracts };

  return (
    <div className="wrap">
      <nav className="site-nav">
        <Link className="logo" to="/" aria-label="Silly Beans home">
          <Bean />
          Silly Beans
        </Link>
        <div className="navlinks">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/bean">Bean</NavLink>
          <NavLink to="/farm">Farm</NavLink>
          <NavLink to="/beanstalk">Bean Stalk</NavLink>
        </div>
      </nav>

      <WalletConnect {...wallet} />

      <main>
        <Outlet context={context} />
      </main>

      <footer>
        <p>
          Silly Beans runs on the Sepolia testnet. BEAN has no real value —
          plant, predict and burn to your heart's content.
        </p>
      </footer>
    </div>
  );
}
