import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DiscreteBean", (m) => {
  const bean = m.contract("DiscreteBean");
  const farm = m.contract("RegularFarm", [bean]);

  m.call(bean, "transferOwnership", [farm]);

  return { bean, farm };
});