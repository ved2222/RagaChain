import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.create();

  const [owner, singer] = await ethers.getSigners();

  const contract = await ethers.getContractAt(
    "MusicRegistry",
    CONTRACT_ADDRESS,
    owner
  );

  console.log("Trying to add contributor to Song #99...");

  try {
    const tx = await contract.addContributor(
      99,
      singer.address,
      "Singer",
      40
    );

    await tx.wait();

    console.log("ERROR: Transaction unexpectedly succeeded!");
  } catch (error) {
    console.log("Transaction rejected successfully!");
    console.log("Reason: Song does not exist");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});