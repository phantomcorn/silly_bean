import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DiscreteBean", (m) => {
  const beans = m.contract("DiscreteBean", [3]);

  m.call(beans, "symbol")

  return { beans };
});