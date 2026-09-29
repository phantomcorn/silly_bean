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
    const accounts = await provider.listAccounts();
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
      await provider.send("eth_requestAccounts", []);
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

  const disconnect = useCallback(() => {
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
