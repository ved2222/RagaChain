import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {

  const { ethers } = await network.create();

  const [owner, singer, composer, lyricist] =
    await ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("Singer:", singer.address);
  console.log("Composer:", composer.address);
  console.log("Lyricist:", lyricist.address);

  const contract = await ethers.getContractAt(
    "MusicRegistry",
    CONTRACT_ADDRESS,
    owner
  );

  console.log("\nAdding contributors...");

  const tx1 = await contract.addContributor(
    1,
    singer.address,
    "Singer",
    40
  );

  await tx1.wait();

  console.log("Singer added: 40%");

  const tx2 = await contract.addContributor(
    1,
    composer.address,
    "Composer",
    35
  );

  await tx2.wait();

  console.log("Composer added: 35%");

  const tx3 = await contract.addContributor(
    1,
    lyricist.address,
    "Lyricist",
    25
  );

  await tx3.wait();

  console.log("Lyricist added: 25%");

  const total =
    await contract.totalRoyaltyShares(1);

  console.log(
    "\nTotal royalty shares:",
    total.toString() + "%"
  );

  console.log("\nReading contributors...");

  for (let i = 0; i < 3; i++) {

    const contributor =
      await contract.contributors(1, i);

    console.log(
      `Contributor ${i + 1}:`,
      contributor[0],
      "| Role:",
      contributor[1],
      "| Share:",
      contributor[2].toString() + "%"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});