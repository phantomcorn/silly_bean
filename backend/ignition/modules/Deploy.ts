import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SillyBean", (m) => {
  const SEPOLIA_ETH_USD_PRICE_FEED_ADDR = "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  const bean = m.contract("DiscreteBean");
  const farm = m.contract("RegularFarm", [bean]);
  const beanstalk = m.contract("BeanStalk", [bean, SEPOLIA_ETH_USD_PRICE_FEED_ADDR], {id: "BeanStalkV2"});
  
  m.call(bean, "setMinter", [farm], {id: "setMinterFarm"});
  m.call(bean, "setMinter", [beanstalk], {id: "setMinterBeanStalkV2"});

  return { bean, farm, beanstalk };
});