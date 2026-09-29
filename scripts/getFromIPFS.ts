const cid =
    "bafybeiby2j4h7wepva6qxy6eakkqf727n66bqh6erjzixmzqxlti7crmpm";

const gatewayURL =
    `https://gateway.pinata.cloud/ipfs/${cid}`;

async function main() {

    console.log("Fetching from IPFS...");
    console.log("CID:", cid);

    const response = await fetch(gatewayURL);

    if (!response.ok) {
        throw new Error(
            `IPFS request failed: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.arrayBuffer();

    console.log("IPFS retrieval successful!");
    console.log("File size:", data.byteLength, "bytes");
    console.log("Gateway URL:", gatewayURL);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});