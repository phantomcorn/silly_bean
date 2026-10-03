import { Link } from "react-router-dom";
import { Bean, BeanField } from "../components/Bean";
import { BeanstalkIcon, FarmIcon } from "../components/CardIcons";

export function HomePage() {
  return (
    <>
      <header className="hero">
        <div>
          <div className="eyebrow">Beans, but make them on-chain</div>
          <h1 aria-label="Silly Bean">
            <span className="letters" aria-hidden="true">
              {[..."Silly"].map((letter, i) => (
                <span key={i}>{letter}</span>
              ))}
            </span>{" "}
            <span className="tilt" aria-hidden="true">
              Bean
            </span>
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
          <Link className="sticker" to="/bean">
            <div className="card sticker-face">
              <Bean className="card-bean" fill="var(--moss)" />
              <h3>Bean</h3>
              <p>ERC-20 token: claim, check your balance, transfer and burn.</p>
              <span className="sticker-cta">Open Bean →</span>
            </div>
          </Link>
          <Link className="sticker" to="/farm">
            <div className="card sticker-face">
              <FarmIcon />
              <h3>Farm</h3>
              <p>Staking pool: stake your beans, earn a reward every minute, claim any time.</p>
              <span className="sticker-cta">Open Farm →</span>
            </div>
          </Link>
          <Link className="sticker" to="/beanstalk">
            <div className="card sticker-face">
              <BeanstalkIcon />
              <h3>Bean Stalk</h3>
              <p>Prediction market: stake into the house, or call the price higher or lower.</p>
              <span className="sticker-cta">Open Bean Stalk →</span>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
