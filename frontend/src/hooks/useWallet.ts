import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { SEPOLIA_CHAIN_ID_HEX } from "../config/contracts";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider & {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        handler: (...args: unknown[]) => void,
      ) => void;
    };
  }
}

export interface WalletState {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

// Remembers an explicit disconnect so refresh() doesn't silently reconnect
// on reload or on accountsChanged/chainChanged events.
const DISCONNECTED_KEY = "wallet:disconnected";

function isManuallyDisconnected() {
  try {
    return localStorage.getItem(DISCONNECTED_KEY) === "1";
  } catch {
    return false;
  }
}

function setManuallyDisconnected(value: boolean) {
  try {
    if (value) localStorage.setItem(DISCONNECTED_KEY, "1");
    else localStorage.removeItem(DISCONNECTED_KEY);
  } catch {
    // Storage unavailable; disconnect still applies for this session.
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: null,
    signer: null,
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!window.ethereum) return;
    const provider = new BrowserProvider(window.ethereum);
    const accounts = isManuallyDisconnected()
      ? []
      : await provider.listAccounts();
    if (accounts.length === 0) {
      setState((s) => ({
        ...s,
        provider,
        signer: null,
        address: null,
      }));
      return;
    }
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    setState((s) => ({
      ...s,
      provider,
      signer,
      address: accounts[0].address,
      chainId: Number(network.chainId),
    }));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({
        ...s,
        error: "No wallet found. Please install MetaMask.",
      }));
      return;
    }
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const provider = new BrowserProvider(window.ethereum);
      // eth_requestAccounts resolves silently if the site is already
      // authorised, so ask for permissions to always show the wallet prompt.
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        // 4001 = user rejected; anything else = wallet lacks the method.
        if ((err as { code?: number }).code === 4001) throw err;
        await provider.send("eth_requestAccounts", []);
      }
      setManuallyDisconnected(false);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const address = await signer.getAddress();
      setState({
        provider,
        signer,
        address,
        chainId: Number(network.chainId),
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet.",
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    setManuallyDisconnected(true);
    // Revoke the site's account permission in the wallet too (MetaMask
    // supports this); ignore wallets that don't.
    try {
      await window.ethereum?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      // Not supported — local disconnect is enough.
    }
    setState({
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error:
          err instanceof Error ? err.message : "Failed to switch network.",
      }));
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    refresh();

    const handleAccountsChanged = () => {
      refresh();
    };
    const handleChainChanged = () => {
      refresh();
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged,
      );
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [refresh]);

  return { ...state, connect, disconnect, switchToSepolia };
}
