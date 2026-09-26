deploy-testnet:
	npx hardhat ignition deploy ignition/modules/Deploy.ts --network sepolia

verify-bean:
	npx hardhat verify --network sepolia 0xc3db73C54ECf44a67eb3f12007fD6b5770e1D299

verify-farm:
	npx hardhat verify --network sepolia 0xECb4ac66CEA2e69DB864D2951fE515C800e9C260 0xc3db73C54ECf44a67eb3f12007fD6b5770e1D299