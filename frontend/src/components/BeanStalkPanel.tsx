import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { useTxStatus } from "../hooks/useTxStatus";
import { CONTRACT_ADDRESSES } from "../config/contracts";

interface Props {
  discreteBean: Contract | null;
  beanStalk: Contract | null;
  address: string | null;
}

export function BeanStalkPanel({ discreteBean, beanStalk, address }: Props) {
  const [stakedAmount, setStakedAmount] = useState<string | null>(null);
  const [earnSoFar, setEarnSoFar] = useState<string | null>(null);
  const [currPrice, setCurrPrice] = useState<string | null>(null);
  const [beansOnTheHouse, setBeansOnTheHouse] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [predictAmount, setPredictAmount] = useState("");
  const [predictHigher, setPredictHigher] = useState(true);

  const status = useTxStatus();

  const loadData = useCallback(async () => {
    if (!beanStalk || !discreteBean || !address) return;
    const [staked, earned, price, house, bal] = await Promise.all([
      beanStalk.getAmountStake(),
      beanStalk.getEarnSoFar(),
      beanStalk.getCurrPrice(),
      beanStalk.getBeansOnTheHouse(),
      discreteBean.balanceOf(address),
    ]);
    setStakedAmount(staked.toString());
    setEarnSoFar(earned.toString());
    setCurrPrice(price.toString());
    setBeansOnTheHouse(house.toString());
    setWalletBalance(bal.toString());
  }, [beanStalk, discreteBean, address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStake = () =>
    status.run(async () => {
      if (!beanStalk || !discreteBean) throw new Error("Contract not ready.");
      const amount = BigInt(stakeAmount || "0");
      if (amount <= 0n) throw new Error("Enter an amount to stake.");

      const approveTx = await discreteBean.approve(
        CONTRACT_ADDRESSES.beanStalk,
        amount,
      );
      await approveTx.wait();

      const stakeTx = await beanStalk.stake(amount);
      await stakeTx.wait();
      status.setMessage(`Staked ${stakeAmount} BEAN`);
      await loadData();
    });

  const handleUnstake = () =>
    status.run(async () => {
      if (!beanStalk) throw new Error("Contract not ready.");
      const tx = await beanStalk.unstake(BigInt(unstakeAmount || "0"));
      await tx.wait();
      status.setMessage(`Unstaked ${unstakeAmount} BEAN`);
      await loadData();
    });

  const handlePredict = () =>
    status.run(async () => {
      if (!beanStalk) throw new Error("Contract not ready.");
      const tx = await beanStalk.predict(
        BigInt(predictAmount || "0"),
        predictHigher,
      );
      await tx.wait();
      status.setMessage(
        `Predicted ${predictHigher ? "higher" : "lower"} with ${predictAmount} BEAN`,
      );
      await loadData();
    });

  const handleRefresh = () =>
    status.run(async () => {
      if (!beanStalk) throw new Error("Contract not ready.");
      const tx = await beanStalk.refresh();
      await tx.wait();
      status.setMessage("Price refreshed.");
      await loadData();
    });

  return (
    <section>
      <h2>Bean Stalk (Prediction Market)</h2>
      <p>Contract: {CONTRACT_ADDRESSES.beanStalk}</p>
      <p>Your staked amount: {stakedAmount ?? "-"} BEAN</p>
      <p>Your earnings so far: {earnSoFar ?? "-"} BEAN</p>
      <p>Current recorded ETH/USD price: {currPrice ?? "-"}</p>
      <p>Beans on the house: {beansOnTheHouse ?? "-"}</p>
      <p>Your wallet balance: {walletBalance ?? "-"} BEAN</p>
      <button onClick={loadData} disabled={!beanStalk || !address}>
        Refresh view
      </button>
      <button onClick={handleRefresh} disabled={status.busy || !beanStalk}>
        Refresh on-chain price
      </button>

      <h3>Stake</h3>
      <div>
        <input
          placeholder="Amount"
          type="number"
          min="0"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />
        <button onClick={handleStake} disabled={status.busy || !beanStalk}>
          Stake
        </button>
      </div>

      <h3>Unstake</h3>
      <div>
        <input
          placeholder="Amount"
          type="number"
          min="0"
          value={unstakeAmount}
          onChange={(e) => setUnstakeAmount(e.target.value)}
        />
        <button onClick={handleUnstake} disabled={status.busy || !beanStalk}>
          Unstake
        </button>
      </div>

      <h3>Predict</h3>
      <div>
        <input
          placeholder="Amount"
          type="number"
          min="0"
          value={predictAmount}
          onChange={(e) => setPredictAmount(e.target.value)}
        />
        <label>
          <input
            type="radio"
            name="direction"
            checked={predictHigher}
            onChange={() => setPredictHigher(true)}
          />
          Higher
        </label>
        <label>
          <input
            type="radio"
            name="direction"
            checked={!predictHigher}
            onChange={() => setPredictHigher(false)}
          />
          Lower
        </label>
        <button onClick={handlePredict} disabled={status.busy || !beanStalk}>
          Predict
        </button>
      </div>

      {status.busy && <p>Pending transaction...</p>}
      {status.message && <p>{status.message}</p>}
      {status.error && <p role="alert">{status.error}</p>}
    </section>
  );
}
