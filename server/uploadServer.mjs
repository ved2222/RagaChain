import "dotenv/config";
import { createServer } from "node:http";
import { PinataSDK } from "pinata";

const HOST = "127.0.0.1";
const PORT = Number(process.env.UPLOAD_PORT || 3001);
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

if (!process.env.PINATA_JWT) {
  console.error("PINATA_JWT is missing. Add it to the project root .env file.");
  process.exit(1);
}

const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT });

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    sendJson(response, 403, { error: "Origin not allowed." });
    return;
  }

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  if (request.method === "OPTIONS" && request.url === "/api/upload") {
    response.writeHead(204, {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-File-Name",
      "Access-Control-Max-Age": "600",
    });
    response.end();
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/upload") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  const contentType = request.headers["content-type"] || "";
  if (!contentType.toLowerCase().startsWith("audio/")) {
    sendJson(response, 415, { error: "Upload an audio file." });
    return;
  }

  const declaredLength = Number(request.headers["content-length"] || 0);
  if (declaredLength > MAX_FILE_SIZE) {
    sendJson(response, 413, { error: "Audio file must be 50 MB or smaller." });
    request.resume();
    return;
  }

  try {
    const chunks = [];
    let receivedBytes = 0;
    let tooLarge = false;
    for await (const chunk of request) {
      receivedBytes += chunk.length;
      if (!tooLarge && receivedBytes > MAX_FILE_SIZE) {
        tooLarge = true;
        sendJson(response, 413, { error: "Audio file must be 50 MB or smaller." });
      }
      if (!tooLarge) chunks.push(chunk);
    }

    if (tooLarge) return;
    if (receivedBytes === 0) {
      sendJson(response, 400, { error: "The uploaded file is empty." });
      return;
    }

    const rawName = request.headers["x-file-name"];
    const filename = typeof rawName === "string"
      ? decodeURIComponent(rawName).replace(/[\\/\0-\x1f\x7f]/g, "_").slice(0, 120)
      : "song-audio";
    const file = new File([Buffer.concat(chunks)], filename || "song-audio", {
      type: contentType.split(";")[0],
    });
    const upload = await pinata.upload.public.file(file);

    sendJson(response, 200, { cid: upload.cid });
  } catch (error) {
    console.error("Pinata upload failed:", error instanceof Error ? error.message : "Unknown error");
    if (!response.headersSent) {
      sendJson(response, 502, { error: "Pinata upload failed. Check the server log." });
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Pinata upload API listening at http://${HOST}:${PORT}`);
});
