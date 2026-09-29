import { network } from "hardhat";
import { formatEther } from "ethers";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.create();

  const [
    buyer,
    singer,
    composer,
    lyricist
  ] = await ethers.getSigners();

  const contract = await ethers.getContractAt(
    "MusicRegistry",
    CONTRACT_ADDRESS,
    buyer
  );

  console.log("Buyer:", buyer.address);

  console.log("\nChecking license price...");

  const price = await contract.licensePrices(1);

  console.log(
    "License Price:",
    formatEther(price),
    "ETH"
  );

  console.log("\nChecking contributor balances...");

  const singerBefore =
    await ethers.provider.getBalance(
      singer.address
    );

  const composerBefore =
    await ethers.provider.getBalance(
      composer.address
    );

  const lyricistBefore =
    await ethers.provider.getBalance(
      lyricist.address
    );

  console.log(
    "Singer before:",
    formatEther(singerBefore),
    "ETH"
  );

  console.log(
    "Composer before:",
    formatEther(composerBefore),
    "ETH"
  );

  console.log(
    "Lyricist before:",
    formatEther(lyricistBefore),
    "ETH"
  );

  console.log("\nPurchasing license...");

  const transaction =
    await contract.purchaseLicense(1, {
      value: price
    });

  console.log(
    "Transaction sent:",
    transaction.hash
  );

  await transaction.wait();

  console.log(
    "License purchased successfully!"
  );

  console.log("\nChecking contributor balances...");

  const singerAfter =
    await ethers.provider.getBalance(
      singer.address
    );

  const composerAfter =
    await ethers.provider.getBalance(
      composer.address
    );

  const lyricistAfter =
    await ethers.provider.getBalance(
      lyricist.address
    );

  console.log(
    "Singer after:",
    formatEther(singerAfter),
    "ETH"
  );

  console.log(
    "Composer after:",
    formatEther(composerAfter),
    "ETH"
  );

  console.log(
    "Lyricist after:",
    formatEther(lyricistAfter),
    "ETH"
  );

  console.log("\nChecking license ownership...");

  const hasLicense =
    await contract.hasLicense(
      1,
      buyer.address
    );

  console.log(
    "Buyer has license:",
    hasLicense
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});