import { useCallback, useEffect, useState } from "react";
import { formatUnits, type Contract } from "ethers";
import { useTxStatus } from "../hooks/useTxStatus";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import { StakeIcon, UnstakeIcon, PredictIcon } from "./CardIcons";
import { TxStatus } from "./TxStatus";

interface Props {
  discreteBean: Contract | null;
  beanStalk: Contract | null;
  address: string | null;
}

// Mirrors PredictionQueue.Outcome: None = 0, Win = 1, Draw = 2, Lose = 3
const OUTCOME_LABELS = ["-", "Won", "Draw", "Lost"] as const;
const OUTCOME_PILLS = ["none", "win", "draw", "lose"] as const;

interface PredictionRound {
  owner: string;
  roundNum: string;
  hasResolved: boolean;
  stakedAmount: string;
  currPrice: string;
  createdAt: string;
  isHigher: boolean;
  endingPrice: string;
  outcome: number;
}

export function BeanStalkPanel({ discreteBean, beanStalk, address }: Props) {
  const [stakedAmount, setStakedAmount] = useState<string | null>(null);
  const [earnSoFar, setEarnSoFar] = useState<string | null>(null);
  const [rounds, setRounds] = useState<PredictionRound[]>([]);
  const [beansOnTheHouse, setBeansOnTheHouse] = useState<string | null>(null);
  const [totalStake, setTotalStake] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [priceDecimals, setPriceDecimals] = useState<number | null>(null);

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [predictAmount, setPredictAmount] = useState("");
  const [predictHigher, setPredictHigher] = useState(true);

  const status = useTxStatus();

  const loadData = useCallback(async () => {
    if (!beanStalk || !discreteBean || !address) return;
    const [staked, earned, predictionRounds, house, total, bal, decimals] =
      await Promise.all([
        beanStalk.getAmountStake(),
        beanStalk.getEarnSoFar(),
        beanStalk.getPredictionRounds(),
        beanStalk.beansOnTheHouse(),
        beanStalk.totalStake(),
        discreteBean.balanceOf(address),
        beanStalk.getOracleDecimals(),
      ]);
    setStakedAmount(staked.toString());
    setEarnSoFar(earned.toString());
    setRounds(
      predictionRounds.map((round: PredictionRound) => ({
        owner: round.owner,
        roundNum: round.roundNum.toString(),
        hasResolved: round.hasResolved,
        stakedAmount: round.stakedAmount.toString(),
        currPrice: round.currPrice.toString(),
        createdAt: round.createdAt.toString(),
        isHigher: round.isHigher,
        endingPrice: round.endingPrice.toString(),
        outcome: Number(round.outcome),
      })),
    );
    setBeansOnTheHouse(house.toString());
    setTotalStake(total.toString());
    setWalletBalance(bal.toString());
    setPriceDecimals(Number(decimals));
  }, [beanStalk, discreteBean, address]);

  // Oracle prices are fixed-point integers scaled by the oracle's decimals.
  const formatPrice = (raw: string) =>
    priceDecimals === null
      ? "-"
      : `$${Number(formatUnits(raw, priceDecimals)).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

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
      const tx = await beanStalk.lockInPredict(
        BigInt(predictAmount || "0"),
        predictHigher,
      );
      await tx.wait();
      status.setMessage(
        `Predicted ${predictHigher ? "higher" : "lower"} with ${predictAmount} BEAN`,
      );
      await loadData();
    });

  const handleResolve = () =>
    status.run(async () => {
      if (!beanStalk) throw new Error("Contract not ready.");
      const tx = await beanStalk.resolve();
      await tx.wait();
      status.setMessage("Prediction round resolved.");
      await loadData();
    });

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Prediction market</div>
          <h2>Bean Stalk</h2>
          <p className="mono">{CONTRACT_ADDRESSES.beanStalk}</p>
        </div>
        <div className="toolbar">
          <button className="small ghost" onClick={loadData} disabled={!beanStalk || !address}>
            Refresh
          </button>
          <button className="small" onClick={handleResolve} disabled={status.busy || !beanStalk}>
            Resolve round (Simulate backend call)
          </button>
        </div>
      </div>

      <dl className="stats">
        <div className="stat">
          <dt>Your staked amount</dt>
          <dd>{stakedAmount ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Your earnings so far</dt>
          <dd>{earnSoFar ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Your wallet balance</dt>
          <dd>{walletBalance ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Total staked (all users)</dt>
          <dd>{totalStake ?? "-"}<small>BEAN</small></dd>
        </div>
        <div className="stat">
          <dt>Beans on the house</dt>
          <dd>{beansOnTheHouse ?? "-"}<small>BEAN</small></dd>
        </div>
      </dl>

      <div className="cards">
        <div className="card">
          <StakeIcon />
          <h3>Stake</h3>
          <p>Feeling risky? Try your luck by putting your beans here</p>
          <div className="row">
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
        </div>

        <div className="card">
          <UnstakeIcon />
          <h3>Unstake</h3>
          <p>Time to go to bed. No more gambling.</p>
          <div className="row">
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
        </div>

        <div className="card">
          <PredictIcon />
          <h3>Predict</h3>
          <p>Will the price go higher or lower by the end of the round?</p>
          <div className="row">
            <label className="choice">
              <input
                type="radio"
                name="direction"
                checked={predictHigher}
                onChange={() => setPredictHigher(true)}
              />
              Higher
            </label>
            <label className="choice">
              <input
                type="radio"
                name="direction"
                checked={!predictHigher}
                onChange={() => setPredictHigher(false)}
              />
              Lower
            </label>
          </div>
          <div className="row">
            <input
              placeholder="Amount"
              type="number"
              min="0"
              value={predictAmount}
              onChange={(e) => setPredictAmount(e.target.value)}
            />
            <button onClick={handlePredict} disabled={status.busy || !beanStalk}>
              Predict
            </button>
          </div>
        </div>
      </div>

      <h3>Recent prediction rounds</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Owner</th>
              <th>Created At</th>
              <th>Staked</th>
              <th>Recorded Price</th>
              <th>Direction</th>
              <th>Resolved</th>
              <th>Ending Price</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rounds.length === 0 && (
              <tr>
                <td className="empty" colSpan={9}>
                  No rounds yet.
                </td>
              </tr>
            )}
            {rounds.map((round) => (
              <tr key={round.roundNum}>
                <td className="mono">{round.roundNum}</td>
                <td className="mono">
                  {address && round.owner.toLowerCase() === address.toLowerCase()
                    ? "You"
                    : `${round.owner.slice(0, 6)}…${round.owner.slice(-4)}`}
                </td>
                <td>{new Date(Number(round.createdAt) * 1000).toLocaleString()}</td>
                <td>{round.stakedAmount} BEAN</td>
                <td>{formatPrice(round.currPrice)}</td>
                <td>{round.isHigher ? "Higher" : "Lower"}</td>
                <td>{round.hasResolved ? "Yes" : "No"}</td>
                <td>{round.hasResolved ? formatPrice(round.endingPrice) : "-"}</td>
                <td>
                  <span className={`pill ${OUTCOME_PILLS[round.outcome] ?? "none"}`}>
                    {OUTCOME_LABELS[round.outcome] ?? "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TxStatus status={status} />
    </section>
  );
}
