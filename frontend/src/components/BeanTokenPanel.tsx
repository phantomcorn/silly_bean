import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { useTxStatus } from "../hooks/useTxStatus";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import { ClaimIcon, TransferIcon, BurnIcon } from "./CardIcons";
import { TxStatus } from "./TxStatus";

interface Props {
  discreteBean: Contract | null;
  address: string | null;
}

export function BeanTokenPanel({ discreteBean, address }: Props) {
  const [balance, setBalance] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null);
  const [freeLimit, setFreeLimit] = useState<string | null>(null);

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [burnAmount, setBurnAmount] = useState("");

  const status = useTxStatus();

  const loadData = useCallback(async () => {
    if (!discreteBean || !address) return;
    const [bal, supply, claimed, limit] = await Promise.all([
      discreteBean.balanceOf(address),
      discreteBean.totalSupply(),
      discreteBean.hasClaim(address),
      discreteBean.FREE_REDEMPTION_LIMIT(),
    ]);
    setBalance(bal.toString());
    setTotalSupply(supply.toString());
    setHasClaimed(claimed);
    setFreeLimit(limit.toString());
  }, [discreteBean, address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaim = () =>
    status.run(async () => {
      if (!discreteBean) throw new Error("Contract not ready.");
      const tx = await discreteBean.claimFreeBean();
      await tx.wait();
      status.setMessage(`Claimed ${freeLimit ?? ""} free BEAN`);
      await loadData();
    });

  const handleTransfer = () =>
    status.run(async () => {
      if (!discreteBean) throw new Error("Contract not ready.");
      const tx = await discreteBean.transfer(transferTo, BigInt(transferAmount || "0"));
      await tx.wait();
      status.setMessage(`Transferred ${transferAmount} BEAN to ${transferTo}`);
      await loadData();
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
    <section className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ERC-20 token</div>
          <h2>Discrete Bean</h2>
          <p className="mono">{CONTRACT_ADDRESSES.discreteBean}</p>
        </div>
        <div className="toolbar">
          <button className="small ghost" onClick={loadData} disabled={!discreteBean || !address}>
            Refresh
          </button>
        </div>
      </div>

      <dl className="stats">
        <div className="stat">
          <dt>Your balance</dt>
          <dd>{balance ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Total supply</dt>
          <dd>{totalSupply ?? "-"}<small>BEAN</small></dd>
        </div>
      </dl>

      <div className="cards">
        <div className="card">
          <ClaimIcon />
          <h3>Claim free beans</h3>
          {hasClaimed ? (
            <p>You have already claimed your free beans.</p>
          ) : (
            <>
              <p>Every wallet gets one free handful to start with.</p>
              <div className="row">
                <button
                  onClick={handleClaim}
                  disabled={status.busy || !discreteBean || !address || hasClaimed === null}
                >
                  Claim {freeLimit ?? "-"} free BEAN
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <TransferIcon />
          <h3>Transfer</h3>
          <div className="row">
            <input
              placeholder="Recipient address"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            />
          </div>
          <div className="row">
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
        </div>

        <div className="card">
          <BurnIcon />
          <h3>Burn</h3>
          <p>Send beans to the compost heap. This can't be undone.</p>
          <div className="row">
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
        </div>
      </div>

      <TxStatus status={status} />
    </section>
  );
}
