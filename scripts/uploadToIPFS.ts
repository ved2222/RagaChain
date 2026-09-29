import "dotenv/config";
import { PinataSDK } from "pinata";
import fs from "fs";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
});

async function main() {

    const fileBuffer = fs.readFileSync("naina.mp3");

    const file = new File(
        [fileBuffer],
        "naina.mp3",
        { type: "audio/mpeg" }
    );

    const upload = await pinata.upload.public.file(file);

    console.log("Music upload successful!");
    console.log("Song:", "naina.mp3");
    console.log("CID:", upload.cid);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});