import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("MusicRegistry", function () {

  it("Should register a song with contributors", async function () {

    // Get test wallets
    const [artist, singer, composer, lyricist] =
      await ethers.getSigners();

    // Deploy the MusicRegistry contract
    const musicRegistry = await ethers.deployContract("MusicRegistry");

    // Register the song
    await musicRegistry.registerSong(
    "Naina",
    "bafybeiby2j4h7wepva6qxy6eakkqf727n66bqh6erjzixmzqxlti7crmpm"
    );

    // Add contributors
    await musicRegistry.addContributor(
      1,
      singer.address,
      "Singer",
      40
    );

    await musicRegistry.addContributor(
      1,
      composer.address,
      "Composer",
      25
    );

    await musicRegistry.addContributor(
      1,
      lyricist.address,
      "Lyricist",
      20
    );

    // Read contributors of Song #1
    const contributor1 = await musicRegistry.contributors(1, 0);
    const contributor2 = await musicRegistry.contributors(1, 1);
    const contributor3 = await musicRegistry.contributors(1, 2);

    // Check Singer
    expect(contributor1[0]).to.equal(singer.address);
    expect(contributor1[1]).to.equal("Singer");
    expect(contributor1[2]).to.equal(40n);

    // Check Composer
    expect(contributor2[0]).to.equal(composer.address);
    expect(contributor2[1]).to.equal("Composer");
    expect(contributor2[2]).to.equal(25n);

    // Check Lyricist
    expect(contributor3[0]).to.equal(lyricist.address);
    expect(contributor3[1]).to.equal("Lyricist");
    expect(contributor3[2]).to.equal(20n);
  });

});

it("Should reject royalty shares above 100%", async function () {

  const [, singer, composer] = await ethers.getSigners();

  const musicRegistry = await ethers.deployContract("MusicRegistry");

  // Register the song
  await musicRegistry.registerSong(
    "Safar",
    "QmExample123"
  );

  // Add 70% to the singer
  await musicRegistry.addContributor(
    1,
    singer.address,
    "Singer",
    70
  );

  // Try to add another 40%
  // 70 + 40 = 110%, so this should fail
  await expect(
    musicRegistry.addContributor(
      1,
      composer.address,
      "Composer",
      40
    )
  ).to.be.revertedWith(
    "Royalty shares cannot exceed 100%"
  );
});

it("Should set the license price", async function () {

  // Deploy the contract
  const musicRegistry = await ethers.deployContract("MusicRegistry");

  // Register a song
  await musicRegistry.registerSong(
    "Safar",
    "QmExample123"
  );

  // Set the license price to 0.1 ETH
  const price = ethers.parseEther("0.1");

  await musicRegistry.setLicensePrice(1, price);

  // Read the price from the blockchain
  const storedPrice = await musicRegistry.licensePrices(1);

  // Verify that the stored price is correct
  expect(storedPrice).to.equal(price);
});

it("Should distribute license payment to contributors", async function () {
    const [, singer, composer, lyricist, producer] =
        await ethers.getSigners();

    const musicRegistry =
        await ethers.deployContract("MusicRegistry");

    await musicRegistry.registerSong(
        "Safar",
        "QmExample123"
    );

    await musicRegistry.addContributor(
        1,
        singer.address,
        "Singer",
        40
    );

    await musicRegistry.addContributor(
        1,
        composer.address,
        "Composer",
        25
    );

    await musicRegistry.addContributor(
        1,
        lyricist.address,
        "Lyricist",
        20
    );

    await musicRegistry.addContributor(
        1,
        producer.address,
        "Producer",
        15
    );

    const price = ethers.parseEther("0.1");

    await musicRegistry.setLicensePrice(
        1,
        price
    );

    // Check balances before purchase
    const singerBefore =
        await ethers.provider.getBalance(singer.address);

    const composerBefore =
        await ethers.provider.getBalance(composer.address);

    const lyricistBefore =
        await ethers.provider.getBalance(lyricist.address);

    const producerBefore =
        await ethers.provider.getBalance(producer.address);

    // Buyer purchases the license
    await musicRegistry.purchaseLicense(
        1,
        { value: price }
    );

    // Check balances after purchase
    const singerAfter =
        await ethers.provider.getBalance(singer.address);

    const composerAfter =
        await ethers.provider.getBalance(composer.address);

    const lyricistAfter =
        await ethers.provider.getBalance(lyricist.address);

    const producerAfter =
        await ethers.provider.getBalance(producer.address);

    // Verify royalty payments
    expect(singerAfter - singerBefore)
        .to.equal(ethers.parseEther("0.04"));

    expect(composerAfter - composerBefore)
        .to.equal(ethers.parseEther("0.025"));

    expect(lyricistAfter - lyricistBefore)
        .to.equal(ethers.parseEther("0.02"));

    expect(producerAfter - producerBefore)
        .to.equal(ethers.parseEther("0.015"));

    // Contract should have no ETH left
    const contractBalance =
        await ethers.provider.getBalance(
            await musicRegistry.getAddress()
        );

    expect(contractBalance).to.equal(0n);
});


it("Should calculate royalty amounts correctly", async function () {

  const [, singer, composer, lyricist, producer] =
    await ethers.getSigners();

  const musicRegistry = await ethers.deployContract("MusicRegistry");

  // Register the song
  await musicRegistry.registerSong(
    "Safar",
    "QmExample123"
  );

  // Add contributors
  await musicRegistry.addContributor(
    1,
    singer.address,
    "Singer",
    40
  );

  await musicRegistry.addContributor(
    1,
    composer.address,
    "Composer",
    25
  );

  await musicRegistry.addContributor(
    1,
    lyricist.address,
    "Lyricist",
    20
  );

  await musicRegistry.addContributor(
    1,
    producer.address,
    "Producer",
    15
  );

  // License payment = 0.1 ETH
  const payment = ethers.parseEther("0.1");

  // Calculate each contributor's royalty
  const singerRoyalty =
    await musicRegistry.calculateRoyalty(1, payment, 0);

  const composerRoyalty =
    await musicRegistry.calculateRoyalty(1, payment, 1);

  const lyricistRoyalty =
    await musicRegistry.calculateRoyalty(1, payment, 2);

  const producerRoyalty =
    await musicRegistry.calculateRoyalty(1, payment, 3);

  // Verify the calculated amounts
  expect(singerRoyalty).to.equal(
    ethers.parseEther("0.04")
  );

  expect(composerRoyalty).to.equal(
    ethers.parseEther("0.025")
  );

  expect(lyricistRoyalty).to.equal(
    ethers.parseEther("0.02")
  );

  expect(producerRoyalty).to.equal(
    ethers.parseEther("0.015")
  );
});

it("Should emit a LicensePurchased event", async function () {
    const [buyer, singer, composer, lyricist, producer] =
        await ethers.getSigners();

    const musicRegistry =
        await ethers.deployContract("MusicRegistry");

    await musicRegistry.registerSong(
        "Safar",
        "QmExample123"
    );

    await musicRegistry.addContributor(
        1,
        singer.address,
        "Singer",
        40
    );

    await musicRegistry.addContributor(
        1,
        composer.address,
        "Composer",
        25
    );

    await musicRegistry.addContributor(
        1,
        lyricist.address,
        "Lyricist",
        20
    );

    await musicRegistry.addContributor(
        1,
        producer.address,
        "Producer",
        15
    );

    const price = ethers.parseEther("0.1");

    await musicRegistry.setLicensePrice(
        1,
        price
    );

    await expect(
        musicRegistry.connect(buyer).purchaseLicense(
            1,
            { value: price }
        )
    )
        .to.emit(musicRegistry, "LicensePurchased")
        .withArgs(
            1,
            buyer.address,
            price
        );
});

it("Should record license ownership", async function () {
    const [buyer, singer, composer, lyricist, producer] =
        await ethers.getSigners();

    const musicRegistry =
        await ethers.deployContract("MusicRegistry");

    await musicRegistry.registerSong(
        "Safar",
        "QmExample123"
    );

    await musicRegistry.addContributor(
        1,
        singer.address,
        "Singer",
        40
    );

    await musicRegistry.addContributor(
        1,
        composer.address,
        "Composer",
        25
    );

    await musicRegistry.addContributor(
        1,
        lyricist.address,
        "Lyricist",
        20
    );

    await musicRegistry.addContributor(
        1,
        producer.address,
        "Producer",
        15
    );

    const price = ethers.parseEther("0.1");

    await musicRegistry.setLicensePrice(
        1,
        price
    );

    // Before purchase, buyer should not have a license
    expect(
        await musicRegistry.hasLicense(
            1,
            buyer.address
        )
    ).to.equal(false);

    // Buyer purchases the license
    await musicRegistry.connect(buyer).purchaseLicense(
        1,
        { value: price }
    );

    // After purchase, buyer should have a license
    expect(
        await musicRegistry.hasLicense(
            1,
            buyer.address
        )
    ).to.equal(true);
});

it("Should store and retrieve the IPFS CID", async function () {
    const [artist] = await ethers.getSigners();

    const musicRegistry =
        await ethers.deployContract("MusicRegistry");

    const cid =
        "bafybeiby2j4h7wepva6qxy6eakkqf727n66bqh6erjzixmzqxlti7crmpm";

    await musicRegistry.registerSong(
        "Naina",
        cid
    );

    const song =
        await musicRegistry.songs(1);

    expect(song[0]).to.equal(1n);
    expect(song[1]).to.equal("Naina");
    expect(song[2]).to.equal(artist.address);
    expect(song[3]).to.equal(cid);
});