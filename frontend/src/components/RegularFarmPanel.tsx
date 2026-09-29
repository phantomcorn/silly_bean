import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { useTxStatus } from "../hooks/useTxStatus";
import { CONTRACT_ADDRESSES } from "../config/contracts";

interface Props {
  discreteBean: Contract | null;
  regularFarm: Contract | null;
  address: string | null;
}

export function RegularFarmPanel({ discreteBean, regularFarm, address }: Props) {
  const [stakedAmount, setStakedAmount] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const status = useTxStatus();

  const loadData = useCallback(async () => {
    if (!regularFarm || !discreteBean || !address) return;
    const [staked, bal] = await Promise.all([
      regularFarm.getAmountStake(),
      discreteBean.balanceOf(address),
    ]);
    setStakedAmount(staked.toString());
    setWalletBalance(bal.toString());
  }, [regularFarm, discreteBean, address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStake = () =>
    status.run(async () => {
      if (!regularFarm || !discreteBean || !address)
        throw new Error("Contract not ready.");
      const balance = await discreteBean.balanceOf(address);
      if (balance === 0n) throw new Error("No BEAN balance to stake.");

      const approveTx = await discreteBean.approve(
        CONTRACT_ADDRESSES.regularFarm,
        balance,
      );
      await approveTx.wait();

      const stakeTx = await regularFarm.stake();
      await stakeTx.wait();
      status.setMessage(`Staked ${balance.toString()} BEAN`);
      await loadData();
    });

  const handleUnstake = () =>
    status.run(async () => {
      if (!regularFarm) throw new Error("Contract not ready.");
      const tx = await regularFarm.unstake();
      await tx.wait();
      status.setMessage("Unstaked and claimed reward.");
      await loadData();
    });

  const handleClaim = () =>
    status.run(async () => {
      if (!regularFarm) throw new Error("Contract not ready.");
      const tx = await regularFarm.claim();
      await tx.wait();
      status.setMessage("Claimed reward.");
      await loadData();
    });

  return (
    <section>
      <h2>Regular Farm (Staking)</h2>
      <p>Contract: {CONTRACT_ADDRESSES.regularFarm}</p>
      <p>Your staked amount: {stakedAmount ?? "-"} BEAN</p>
      <p>Your wallet balance: {walletBalance ?? "-"} BEAN</p>
      <p>Reward rate: 1 BEAN per minute staked.</p>
      <button onClick={loadData} disabled={!regularFarm || !address}>
        Refresh
      </button>

      <div>
        <button onClick={handleStake} disabled={status.busy || !regularFarm}>
          Stake entire balance
        </button>
        <button onClick={handleUnstake} disabled={status.busy || !regularFarm}>
          Unstake (all + reward)
        </button>
        <button onClick={handleClaim} disabled={status.busy || !regularFarm}>
          Claim reward
        </button>
      </div>

      {status.busy && <p>Pending transaction...</p>}
      {status.message && <p>{status.message}</p>}
      {status.error && <p role="alert">{status.error}</p>}
    </section>
  );
}
