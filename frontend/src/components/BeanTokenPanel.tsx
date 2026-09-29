import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { useTxStatus } from "../hooks/useTxStatus";
import { CONTRACT_ADDRESSES } from "../config/contracts";

interface Props {
  discreteBean: Contract | null;
  address: string | null;
}

export function BeanTokenPanel({ discreteBean, address }: Props) {
  const [balance, setBalance] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<string | null>(null);

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");

  const [burnAmount, setBurnAmount] = useState("");

  const status = useTxStatus();

  const loadData = useCallback(async () => {
    if (!discreteBean || !address) return;
    const [bal, supply] = await Promise.all([
      discreteBean.balanceOf(address),
      discreteBean.totalSupply(),
    ]);
    setBalance(bal.toString());
    setTotalSupply(supply.toString());
  }, [discreteBean, address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransfer = () =>
    status.run(async () => {
      if (!discreteBean) throw new Error("Contract not ready.");
      const tx = await discreteBean.transfer(transferTo, BigInt(transferAmount || "0"));
      await tx.wait();
      status.setMessage(`Transferred ${transferAmount} BEAN to ${transferTo}`);
      await loadData();
    });

  const handleApprove = () =>
    status.run(async () => {
      if (!discreteBean) throw new Error("Contract not ready.");
      const tx = await discreteBean.approve(approveSpender, BigInt(approveAmount || "0"));
      await tx.wait();
      status.setMessage(`Approved ${approveAmount} BEAN for ${approveSpender}`);
    });

  const handleBurn = () =>
    status.run(async () => {
      if (!discreteBean) throw new Error("Contract not ready.");
      const tx = await discreteBean.burn(BigInt(burnAmount || "0"));
      await tx.wait();
      status.setMessage(`Burned ${burnAmount} BEAN`);
      await loadData();
    });

  return (
    <section>
      <h2>Discrete Bean (BEAN)</h2>
      <p>Contract: {CONTRACT_ADDRESSES.discreteBean}</p>
      <p>Your balance: {balance ?? "-"} BEAN</p>
      <p>Total supply: {totalSupply ?? "-"} BEAN</p>
      <button onClick={loadData} disabled={!discreteBean || !address}>
        Refresh
      </button>

      <h3>Transfer</h3>
      <div>
        <input
          placeholder="Recipient address"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
        />
        <input
          placeholder="Amount"
          type="number"
          min="0"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
        />
        <button onClick={handleTransfer} disabled={status.busy || !discreteBean}>
          Transfer
        </button>
      </div>

      <h3>Approve</h3>
      <div>
        <input
          placeholder="Spender address"
          value={approveSpender}
          onChange={(e) => setApproveSpender(e.target.value)}
        />
        <input
          placeholder="Amount"
          type="number"
          min="0"
          value={approveAmount}
          onChange={(e) => setApproveAmount(e.target.value)}
        />
        <button onClick={handleApprove} disabled={status.busy || !discreteBean}>
          Approve
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            setApproveSpender(CONTRACT_ADDRESSES.regularFarm);
          }}
        >
          Fill: Regular Farm
        </button>
        <button
          onClick={() => {
            setApproveSpender(CONTRACT_ADDRESSES.beanStalk);
          }}
        >
          Fill: Bean Stalk
        </button>
      </div>

      <h3>Burn</h3>
      <div>
        <input
          placeholder="Amount"
          type="number"
          min="0"
          value={burnAmount}
          onChange={(e) => setBurnAmount(e.target.value)}
        />
        <button onClick={handleBurn} disabled={status.busy || !discreteBean}>
          Burn
        </button>
      </div>

      {status.busy && <p>Pending transaction...</p>}
      {status.message && <p>{status.message}</p>}
      {status.error && <p role="alert">{status.error}</p>}
    </section>
  );
}
