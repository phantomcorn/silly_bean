import { Link } from "react-router-dom";
import { Bean, BeanField } from "../components/Bean";

export function HomePage() {
  return (
    <>
      <header className="hero">
        <div>
          <div className="eyebrow">Beans, but make them on-chain</div>
          <h1>
            <span>Silly</span> <span className="tilt">Beans</span>
          </h1>
          <p className="lede">
            Claim some free BEAN, plant them in the farm to sprout rewards, or
            bet them on the price in the Bean Stalk. All on Sepolia.
          </p>
          <div className="ctas">
            <Link className="btn" to="/bean">
              Get some beans
            </Link>
            <Link className="btn ghost" to="/beanstalk">
              Make a prediction
            </Link>
          </div>
        </div>
        <BeanField />
      </header>

      <section className="page">
        <h2>Pick a contract</h2>
        <p className="sub">Three contracts, three ways to play with your beans.</p>
        <div className="cards">
          <div className="card">
            <Bean className="card-bean" fill="var(--moss)" />
            <h3>Bean</h3>
            <p>ERC-20 token: claim, check your balance, transfer, approve and burn.</p>
            <Link className="btn small ghost" to="/bean">
              Open Bean
            </Link>
          </div>
          <div className="card">
            <Bean className="card-bean" fill="var(--ochre)" rotate={-20} />
            <h3>Farm</h3>
            <p>Staking pool: stake your beans, earn a reward every minute, claim any time.</p>
            <Link className="btn small ghost" to="/farm">
              Open Farm
            </Link>
          </div>
          <div className="card">
            <Bean className="card-bean" fill="var(--tomato)" rotate={25} />
            <h3>Bean Stalk</h3>
            <p>Prediction market: stake into the house, or call the price higher or lower.</p>
            <Link className="btn small ghost" to="/beanstalk">
              Open Bean Stalk
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
