import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section>
      <p>
        Interact with the Bean Stalk contracts on Sepolia. Pick a contract:
      </p>
      <ul>
        <li>
          <Link to="/bean">Bean</Link> — ERC-20 token: balance, transfer,
          approve, burn, mint.
        </li>
        <li>
          <Link to="/farm">Farm</Link> — Staking pool: stake, unstake, claim.
        </li>
        <li>
          <Link to="/beanstalk">Bean Stalk</Link> — Prediction market: stake,
          unstake, predict.
        </li>
      </ul>
    </section>
  );
}
