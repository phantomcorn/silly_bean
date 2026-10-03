import { SEPOLIA_CHAIN_ID } from "../config/contracts";
import type { useWallet } from "../hooks/useWallet";

type Props = ReturnType<typeof useWallet>;

export function WalletConnect(props: Props) {
  const {
    address,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    switchToSepolia,
  } = props;

  const wrongChain = address && chainId !== SEPOLIA_CHAIN_ID;

  return (
    <section className="wallet" aria-label="Wallet">
      {address ? (
        <>
          <div className="wallet-info">
            <span className="mono" title={address}>
              <span className={wrongChain ? "dot warn" : "dot"} />
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <span className="eyebrow">
              Chain {chainId}
              {wrongChain && ` · expected ${SEPOLIA_CHAIN_ID} (Sepolia)`}
            </span>
          </div>
          <div className="wallet-actions">
            {wrongChain && (
              <button className="small" onClick={switchToSepolia}>
                Switch to Sepolia
              </button>
            )}
            <button className="small ghost" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="eyebrow">No wallet connected</span>
          <button className="small" onClick={connect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </>
      )}
      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
