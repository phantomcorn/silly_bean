import { useCallback, useState } from "react";

export function useTxStatus() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      const anyErr = err as { shortMessage?: string; message?: string };
      setError(anyErr.shortMessage ?? anyErr.message ?? "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, message, setMessage, run };
}
