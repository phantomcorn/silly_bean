deploy-testnet:
	npx hardhat ignition deploy --reset ignition/modules/Deploy.ts --network sepolia 

verify-bean:
	npx hardhat verify --network sepolia 0xb878d053c85cBAaf70B6104B9D77db919777B8aA

verify-farm:
	npx hardhat verify --network sepolia 0x76F6f261Ab8F6CA05C10482F7229BaeFdAD30025 0xb878d053c85cBAaf70B6104B9D77db919777B8aA

verify-beanstalk:
	npx hardhat verify --network sepolia 0xeC35e7A7fFC40eC7a6E0bdDD818fC288865f4975 0xb878d053c85cBAaf70B6104B9D77db919777B8aA 0x694AA1769357215DE4FAC081bf1f309aDC325306