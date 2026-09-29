# 🎵 RagaChain

## Blockchain-Based Music Ownership, Licensing and Royalty Management System

RagaChain is a blockchain-based music rights management platform designed to provide a transparent and tamper-resistant system for **music registration, contributor management, licensing, and royalty distribution**.

The platform combines **Ethereum-compatible blockchain technology, smart contracts, IPFS, Pinata, MetaMask, and a React frontend** to create a decentralized workflow for managing music rights.

Artists can register their songs, store the actual audio files on IPFS, define contributors and their royalty shares, set a license price, and allow buyers to purchase licenses using cryptocurrency. The smart contract automatically distributes the license payment according to the predefined royalty percentages.

> **Academic Project:** RagaChain is developed as an educational blockchain project. It provides an on-chain record of music registration, ownership claims, licensing, and royalty transactions. It does not replace formal legal copyright registration.

---

# 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Running the Blockchain](#-running-the-blockchain)
- [Deploying the Smart Contract](#-deploying-the-smart-contract)
- [Configuring MetaMask](#-configuring-metamask)
- [Running the IPFS Upload Server](#-running-the-ipfs-upload-server)
- [Running the Frontend](#-running-the-frontend)
- [Using the Application](#-using-the-application)
- [Smart Contract](#-smart-contract)
- [Royalty Distribution](#-royalty-distribution)
- [Blockchain Verification](#-blockchain-verification)
- [Testing](#-testing)
- [Important Notes](#-important-notes)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

# 🔎 Overview

Traditional music rights management involves multiple parties such as artists, singers, composers, lyricists, producers, and licensees. Managing ownership information, licensing agreements, and royalty payments between these parties can become complicated and may lack transparency.

RagaChain addresses this problem by storing important music-rights information on a blockchain.

The system separates storage and blockchain responsibilities:

- **IPFS** stores the actual music file.
- **Blockchain** stores the song metadata, ownership information, contributor information, royalty percentages, license price, and licensing transactions.
- **Smart contracts** enforce royalty rules and distribute license payments.
- **MetaMask** manages user wallets and transaction signing.
- **React** provides the user interface.

---

# ❗ Problem Statement

Music involves multiple contributors who may have different ownership and royalty shares.

A conventional system may require centralized platforms or intermediaries to maintain:

- Song ownership information
- Contributor details
- Licensing records
- Royalty percentages
- Payment records

This can make it difficult for participants to independently verify transactions.

RagaChain aims to provide a blockchain-based system where important registration, licensing, and royalty information can be recorded and verified on-chain.

---

# 🎯 Objectives

The main objectives of RagaChain are:

1. Register songs on an Ethereum-compatible blockchain.
2. Store music files using decentralized IPFS storage.
3. Maintain contributor information on-chain.
4. Define royalty percentages for contributors.
5. Allow artists to set license prices.
6. Allow buyers to purchase music licenses using ETH.
7. Automatically distribute royalty payments through a smart contract.
8. Maintain a verifiable record of licensing transactions.
9. Allow blockchain transactions and wallet balances to be independently verified.

---

# ✨ Key Features

## 🎵 Song Registration

Artists can register a song by providing:

- Song title
- Audio file

The audio file is uploaded to IPFS and the resulting CID is associated with the song on the blockchain.

---

## 📦 IPFS Storage

The actual music file is stored using **IPFS through Pinata**.

Instead of storing a large audio file directly on the blockchain, RagaChain stores its IPFS Content Identifier (CID).

This reduces blockchain storage requirements while allowing the file to be retrieved from IPFS.

---

## 👥 Contributor Management

Artists can add contributors to a song.

Each contributor has:

- Wallet address
- Role
- Royalty percentage

Example:

| Contributor | Role | Royalty Share |
|---|---|---:|
| Contributor 1 | Singer | 40% |
| Contributor 2 | Composer | 35% |
| Contributor 3 | Lyricist | 25% |
| **Total** | | **100%** |

The smart contract prevents the total royalty allocation from exceeding 100%.

---

## 💰 Royalty Distribution

When a buyer purchases a license, the smart contract calculates each contributor's share based on the predefined royalty percentage.

For example, if the license price is:

```text
0.1 ETH
```

and the royalty distribution is:

```text
Singer      → 40%
Composer    → 35%
Lyricist    → 25%
```

the smart contract distributes:

```text
Singer      → 0.040 ETH
Composer    → 0.035 ETH
Lyricist    → 0.025 ETH
--------------------------------
Total       → 0.100 ETH
```

---

## 🎫 Music Licensing

Artists can define a license price for their songs.

A buyer can purchase a license by sending the required ETH amount to the smart contract.

After a successful purchase, the buyer's wallet is recorded as having a license for the song.

---

## 🦊 MetaMask Integration

MetaMask is used to:

- Connect user wallets
- Switch accounts
- Sign blockchain transactions
- Approve license payments
- Display wallet balances

---

## 🔗 Blockchain Verification

Every license purchase generates a blockchain transaction.

The transaction can be independently verified using:

- Transaction hash
- Block number
- Sender address
- Smart contract address
- Transaction value
- Transaction receipt
- Transaction status

This allows the application data to be verified independently of the frontend.

---

# 🔄 How It Works

The overall workflow is:

```text
Artist
  │
  │ Selects music file
  ▼
IPFS / Pinata
  │
  │ Returns CID
  ▼
React Frontend
  │
  │ registerSong(title, CID)
  ▼
MusicRegistry Smart Contract
  │
  ├── Stores song information
  ├── Stores artist wallet
  ├── Stores contributors
  ├── Stores royalty shares
  └── Stores license price
          │
          ▼
       Buyer
          │
          │ Purchases license
          ▼
MusicRegistry Smart Contract
          │
          ├── Verifies royalty shares = 100%
          ├── Verifies payment amount
          ├── Calculates royalty amounts
          ├── Transfers royalty payments
          └── Records buyer license
```

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │        User         │
                         │ Artist / Contributor│
                         │       / Buyer       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React + Vite      │
                         │     Frontend        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      MetaMask       │
                         │   Wallet Provider   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                  ┌──────────────────────────────────┐
                  │       Hardhat Local Network      │
                  │        Ethereum-Compatible       │
                  └───────────────┬──────────────────┘
                                  │
                                  ▼
                  ┌──────────────────────────────────┐
                  │      MusicRegistry.sol           │
                  │        Smart Contract            │
                  ├──────────────────────────────────┤
                  │ Song Registration                │
                  │ Contributor Management           │
                  │ Royalty Management               │
                  │ License Pricing                  │
                  │ License Purchase                 │
                  │ Royalty Distribution             │
                  └──────────────────────────────────┘
                                  │
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
             ┌───────────────┐       ┌────────────────┐
             │   Blockchain  │       │      IPFS      │
             │   Metadata    │       │     Pinata     │
             │   Transactions│       │   Audio Files  │
             └───────────────┘       └────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- ethers.js
- HTML5
- CSS3

## Blockchain

- Solidity
- Hardhat
- Hardhat Ignition
- Ethereum-compatible local blockchain
- MetaMask

## Decentralized Storage

- IPFS
- Pinata

## Backend

- Node.js
- Express
- Pinata SDK

## Development Tools

- Git
- GitHub
- Visual Studio Code

---

# 📁 Project Structure

```text
RagaChain/
│
├── contracts/
│   ├── MusicRegistry.sol
│   ├── Counter.sol
│   └── Counter.t.sol
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── contract.ts
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── ignition/
│   └── modules/
│       ├── MusicRegistry.ts
│       └── Counter.ts
│
├── scripts/
│   ├── getFromIPFS.ts
│   ├── readLicensePrice.ts
│   ├── send-op-tx.ts
│   ├── testInvalidSong.ts
│   ├── testPurchase.ts
│   ├── testRoyalties.ts
│   └── uploadToIPFS.ts
│
├── server/
│   └── uploadServer.mjs
│
├── test/
│   ├── MusicRegistry.ts
│   └── Counter.ts
│
├── hardhat.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

# 💻 Requirements

Before running the project, install the following:

### Required Software

| Software | Recommended Version |
|---|---|
| Node.js | 22.x |
| npm | 11.x |
| Git | Latest |
| MetaMask | Latest |
| Visual Studio Code | Latest |

You will also need:

- A Pinata account
- A Pinata JWT with file upload permissions
- A modern web browser such as Chrome or Edge

---

# 📥 Installation

## 1. Clone the Repository

Clone the project from GitHub:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project directory:

```bash
cd RagaChain
```

---

## 2. Install Root Dependencies

From the root directory:

```bash
npm install
```

---

## 3. Install Frontend Dependencies

Move into the frontend directory:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Return to the root directory:

```bash
cd ..
```

---

# 🔐 Environment Configuration

RagaChain uses a backend server to communicate with Pinata.

Create a `.env` file in the **root directory**:

```env
PINATA_JWT=YOUR_PINATA_JWT
```

Replace `YOUR_PINATA_JWT` with your actual Pinata JWT.

### ⚠️ Security Warning

Never commit your `.env` file to GitHub.

The repository already contains `.gitignore` rules for environment files:

```gitignore
.env
.env.*
!.env.example
```

Never expose:

- Pinata JWT
- Wallet private keys
- API secrets
- Production credentials

---

# ⛓️ Running the Blockchain

Open a terminal in the project root.

Start the Hardhat local blockchain:

```bash
npx hardhat node
```

The local blockchain will run on:

```text
http://127.0.0.1:8545
```

The default Hardhat chain ID is:

```text
31337
```

Keep this terminal running while using the application.

---

# 📜 Deploying the Smart Contract

Open a **new terminal** while keeping the Hardhat node running.

From the project root, deploy the MusicRegistry contract:

```bash
npx hardhat ignition deploy ignition/modules/MusicRegistry.ts --network localhost
```

After deployment, Hardhat will display the deployed contract address.

Copy the deployed address.

Open:

```text
frontend/src/contract.ts
```

Update:

```typescript
export const CONTRACT_ADDRESS =
    "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

with the newly deployed contract address.

> If the Hardhat node is restarted, the local blockchain state is reset. The contract must be deployed again and the frontend contract address must be updated if the new deployment address differs.

---

# 🦊 Configuring MetaMask

Open MetaMask and add a custom network with the following configuration:

```text
Network Name: Hardhat Local

RPC URL:
http://127.0.0.1:8545

Chain ID:
31337

Currency Symbol:
ETH
```

Import one or more accounts generated by the Hardhat node into MetaMask.

Hardhat displays the available development accounts and their private keys when the node starts.

> **Important:** Hardhat development accounts and private keys are intended only for local development. Never use them for real funds or production deployments.

---

# 📦 Running the IPFS Upload Server

The project contains a backend server that handles music uploads to Pinata.

From the project root, run:

```bash
node server/uploadServer.mjs
```

Keep this terminal running.

The backend uses the `PINATA_JWT` stored in the `.env` file.

The JWT is therefore not placed directly inside the React frontend.

---

# 🌐 Running the Frontend

Open another terminal.

Navigate to the frontend:

```bash
cd frontend
```

Start the Vite development server:

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173
```

Open this URL in your browser.

---

# 🎮 Using the Application

## Step 1 — Connect MetaMask

Open the RagaChain application and connect your MetaMask wallet.

The connected wallet address will be displayed in the application.

---

## Step 2 — Register a Song

The artist can:

1. Enter the song title.
2. Select an audio file.
3. Upload the file.
4. The backend uploads the file to IPFS using Pinata.
5. Pinata returns an IPFS CID.
6. The CID is registered with the song on the blockchain.

The blockchain stores the CID rather than the complete audio file.

---

## Step 3 — Add Contributors

Add contributors by specifying:

- Wallet address
- Role
- Royalty percentage

For example:

```text
Singer       → 40%
Composer     → 35%
Lyricist     → 25%
```

The total royalty share cannot exceed 100%.

---

## Step 4 — Set the License Price

Set the price that a buyer must pay to license the song.

For example:

```text
License Price = 0.1 ETH
```

---

## Step 5 — Purchase the License

Switch MetaMask to the buyer account.

Select the song and purchase the license.

MetaMask will display the transaction and request confirmation.

After confirmation:

- The transaction is recorded on the blockchain.
- The buyer receives a license status for the song.
- Royalty payments are distributed according to the predefined shares.

---

# 💰 Royalty Distribution Example

Suppose the license price is:

```text
0.1 ETH
```

and the contributors have the following shares:

| Contributor | Share | Payment |
|---|---:|---:|
| Singer | 40% | 0.040 ETH |
| Composer | 35% | 0.035 ETH |
| Lyricist | 25% | 0.025 ETH |
| **Total** | **100%** | **0.100 ETH** |

The calculation performed by the smart contract is:

```text
Royalty Amount =
License Payment × Royalty Percentage / 100
```

For example:

```text
0.1 × 40 / 100 = 0.04 ETH
```

The smart contract then transfers the calculated amount to the contributor's wallet.

---

# 🔍 Blockchain Verification

One of the important features of RagaChain is that transactions can be verified independently of the frontend.

After purchasing a license, the application displays the transaction hash.

The transaction can be queried directly from the Hardhat JSON-RPC endpoint.

## Get Transaction Details

Replace `TRANSACTION_HASH` with the transaction hash:

```bash
curl -X POST http://127.0.0.1:8545 \
-H "Content-Type: application/json" \
-d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionByHash\",\"params\":[\"TRANSACTION_HASH\"],\"id\":1}"
```

The response contains information such as:

- Transaction hash
- Block number
- Sender address
- Contract address
- Transaction value
- Gas information

---

## Get Transaction Receipt

To verify that the transaction was successfully executed:

```bash
curl -X POST http://127.0.0.1:8545 \
-H "Content-Type: application/json" \
-d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionReceipt\",\"params\":[\"TRANSACTION_HASH\"],\"id\":1}"
```

A successful transaction has:

```text
status: 0x1
```

This provides an independent way to verify that the transaction shown in the frontend was actually processed by the blockchain.

---

# 💳 Wallet Balance Verification

Wallet balances can also be queried directly from the Hardhat blockchain.

For example:

```bash
curl -X POST http://127.0.0.1:8545 \
-H "Content-Type: application/json" \
-d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"WALLET_ADDRESS\",\"latest\"],\"id\":1}"
```

The returned balance is represented in Wei.

This can be used to verify:

- Buyer balance before and after the license purchase.
- Contributor balances before and after royalty distribution.

The buyer's balance decreases by the license payment plus the transaction gas fee.

---

# 📜 Smart Contract

The main smart contract is:

```text
contracts/MusicRegistry.sol
```

The contract contains the core music registration and licensing logic.

## Main Functions

### `registerSong()`

Registers a song on the blockchain.

Stores information such as:

- Song ID
- Song title
- Artist wallet
- IPFS CID

---

### `addContributor()`

Adds a contributor to a song.

Stores:

- Contributor wallet
- Contributor role
- Royalty percentage

The contract prevents total royalty shares from exceeding 100%.

---

### `setLicensePrice()`

Sets the license price for a song.

---

### `purchaseLicense()`

Allows a buyer to purchase a license.

The function:

1. Verifies that royalty shares equal 100%.
2. Verifies that the payment equals the license price.
3. Calculates each contributor's royalty.
4. Transfers the corresponding amount to contributor wallets.
5. Records the buyer as having a license.
6. Emits a license purchase event.

---

### `calculateRoyalty()`

Calculates the royalty amount for a contributor based on:

```text
Payment Amount × Royalty Share / 100
```

---

# 🧪 Testing

Run the complete Hardhat test suite from the root directory:

```bash
npx hardhat test
```

The tests cover functionality such as:

- Song registration
- Contributor registration
- Royalty share validation
- License price configuration
- License purchase
- Royalty calculation
- Invalid song handling

---

# ⚠️ Important Notes

## Local Blockchain

RagaChain currently uses a Hardhat local blockchain for development and demonstration.

Restarting:

```bash
npx hardhat node
```

resets the local blockchain state.

This means previous:

- Transactions
- Songs
- Licenses
- Contributor records
- Contract deployments

will no longer exist on the restarted local chain.

After restarting the node, deploy the smart contract again.

---

## Hardhat Accounts

The accounts generated by Hardhat are development accounts.

Do not use their private keys on:

- Mainnet
- Production applications
- Public testnets containing valuable assets

---

## IPFS

The project uses Pinata for IPFS uploads.

The Pinata JWT must remain private and should only be stored in the local `.env` file.

---

## Academic Prototype

RagaChain is an academic prototype intended to demonstrate:

- Blockchain development
- Smart contracts
- Decentralized storage
- Wallet integration
- Licensing workflows
- Automated royalty distribution

It is not intended to serve as production financial infrastructure or as a replacement for legally recognized copyright systems.

---

# 🚀 Future Improvements

Possible future enhancements include:

- Role-based access control
- Artist-only authorization for sensitive operations
- Reentrancy protection
- Improved smart contract security
- License transfer functionality
- Detailed license history
- Advanced royalty management
- Public testnet deployment
- Production IPFS gateway configuration
- Enhanced transaction analytics
- Automated royalty verification
- Decentralized dispute management
- Multi-song marketplace
- NFT-based licensing
- Improved access control and ownership management

---

# 📄 License

This project is developed for **academic and educational purposes**.

The source code may be used for learning and experimentation with blockchain, smart contracts, decentralized storage, and Web3 application development.

---

# 👨‍💻 Author

**Vedant Chavan**

Computer Engineering Student

---

# ⭐ RagaChain

> **Decentralizing music ownership, licensing and royalty management through blockchain technology.**