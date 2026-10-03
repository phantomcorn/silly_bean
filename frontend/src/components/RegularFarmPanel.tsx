import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { useTxStatus } from "../hooks/useTxStatus";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import { Bean } from "./Bean";
import { TxStatus } from "./TxStatus";

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
    <section className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Staking</div>
          <h2>Regular Farm</h2>
          <p className="mono">{CONTRACT_ADDRESSES.regularFarm}</p>
        </div>
        <div className="toolbar">
          <button className="small ghost" onClick={loadData} disabled={!regularFarm || !address}>
            Refresh
          </button>
        </div>
      </div>

      <dl className="stats">
        <div className="stat">
          <dt>Your staked amount</dt>
          <dd>{stakedAmount ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Your wallet balance</dt>
          <dd>{walletBalance ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Reward rate</dt>
          <dd>1<small>BEAN / minute</small></dd>
        </div>
      </dl>

      <div className="cards">
        <div className="card">
          <Bean className="card-bean" fill="var(--moss)" />
          <h3>Plant</h3>
          <p>Stake your entire BEAN balance into the farm.</p>
          <div className="row">
            <button onClick={handleStake} disabled={status.busy || !regularFarm}>
              Stake entire balance
            </button>
          </div>
        </div>
        <div className="card">
          <Bean className="card-bean" fill="var(--ochre)" rotate={-20} />
          <h3>Harvest</h3>
          <p>Claim your reward and keep your stake growing.</p>
          <div className="row">
            <button onClick={handleClaim} disabled={status.busy || !regularFarm}>
              Claim reward
            </button>
          </div>
        </div>
        <div className="card">
          <Bean className="card-bean" fill="var(--tomato)" rotate={25} />
          <h3>Uproot</h3>
          <p>Unstake everything and collect your reward in one go.</p>
          <div className="row">
            <button onClick={handleUnstake} disabled={status.busy || !regularFarm}>
              Unstake (all + reward)
            </button>
          </div>
        </div>
      </div>

      <TxStatus status={status} />
    </section>
  );
}
