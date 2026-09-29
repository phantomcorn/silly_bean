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

  return (
    <section>
      <h2>Wallet</h2>
      {address ? (
        <div>
          <p>Connected: {address}</p>
          <p>
            Chain ID: {chainId}{" "}
            {chainId !== SEPOLIA_CHAIN_ID && (
              <>
                (expected {SEPOLIA_CHAIN_ID} — Sepolia){" "}
                <button onClick={switchToSepolia}>Switch to Sepolia</button>
              </>
            )}
          </p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
