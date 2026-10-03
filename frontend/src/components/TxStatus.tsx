import type { useTxStatus } from "../hooks/useTxStatus";

export function TxStatus({ status }: { status: ReturnType<typeof useTxStatus> }) {
  return (
    <>
      {status.busy && <p className="status pending">Pending transaction...</p>}
      {status.message && <p className="status ok">{status.message}</p>}
      {status.error && (
        <p className="status error" role="alert">
          {status.error}
        </p>
      )}
    </>
  );
}
