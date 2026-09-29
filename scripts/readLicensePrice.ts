import { network } from "hardhat";
import { formatEther } from "ethers";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.create();

  const contract = await ethers.getContractAt(
    "MusicRegistry",
    CONTRACT_ADDRESS
  );

  const price = await contract.licensePrices(1);

  console.log("Song ID: 1");
  console.log("License Price:", formatEther(price), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});