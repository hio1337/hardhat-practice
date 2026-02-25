import { network } from "hardhat";

async function main() {
  const { ethers, networkName } = await network.connect();

  console.log(`Deploying MusicShop to ${networkName}...`);

  const [deployer, owner] = await ethers.getSigners();
  const shop = await ethers.deployContract("MusicShop", [owner.address]);
  await shop.waitForDeployment();

  const address = await shop.getAddress();

  console.log(`MusicShop deployed to: ${address}`);
  console.log(`Deployed by: ${deployer.address}`);
  console.log(`Owner set to: ${owner.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
