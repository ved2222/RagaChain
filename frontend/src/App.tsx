import { useEffect, useRef, useState } from "react";
import { BrowserProvider, Contract, formatEther, Log, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import "./App.css";

function App() {

  const [account, setAccount] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState("");
  const [songCount, setSongCount] = useState<string>("");
  const [selectedSongId, setSelectedSongId] = useState("1");
  const [currentLicensePrice, setCurrentLicensePrice] = useState("0");
  const [selectedSongFinalized, setSelectedSongFinalized] = useState(false);
  const [artistSongIds, setArtistSongIds] = useState<string[]>([]);
  const [workflowSongId, setWorkflowSongId] = useState("");
  const [workflowSongTitle, setWorkflowSongTitle] = useState("");
  const [workflowArtist, setWorkflowArtist] = useState("");
  const [workflowRoyalty, setWorkflowRoyalty] = useState("0");
  const [workflowPrice, setWorkflowPrice] = useState("0");
  const [workflowFinalized, setWorkflowFinalized] = useState(false);
  const [workflowContributors, setWorkflowContributors] = useState<
    { wallet: string; role: string; royaltyShare: string }[]
  >([]);
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [finalizeStatus, setFinalizeStatus] = useState("");

  const [title, setTitle] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<string>("");

  const [contributorWallet, setContributorWallet] = useState<string>("");
  const [contributorRole, setContributorRole] = useState<string>("");
  const [royaltyShare, setRoyaltyShare] = useState<string>("");
  const [contributorStatus, setContributorStatus] = useState<string>("");
  const [isAddingContributor, setIsAddingContributor] = useState(false);
  const isAddingContributorRef = useRef(false);
  const [licensePrice, setLicensePrice] = useState<string>("");
  const [licensePriceStatus, setLicensePriceStatus] =
  useState<string>("");
  const [purchaseStatus, setPurchaseStatus] =
  useState<string>("");
const [hasLicense, setHasLicense] =
  useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseReceipt, setPurchaseReceipt] = useState<{
    songId: string;
    title: string;
    buyer: string;
    transactionHash: string;
    blockNumber: number;
    licenseAmount: string;
    gasFee: string;
    balanceBefore: string;
    balanceAfter: string;
    payouts: { wallet: string; role: string; amount: string }[];
    payoutEvidence: "events" | "shares";
  } | null>(null);

  const [song, setSong] = useState<{
    id: string;
    title: string;
    artist: string;
    ipfsCID: string;
  } | null>(null);

  const [contributors, setContributors] = useState<
  {
    wallet: string;
    role: string;
    royaltyShare: string;
  }[]
>([]);

const [totalRoyalty, setTotalRoyalty] = useState<string>("");

  const [contributorReadStatus, setContributorReadStatus] =
  useState<string>("");

  const isWorkflowArtist = Boolean(
    account && workflowArtist && account.toLowerCase() === workflowArtist.toLowerCase()
  );
  const workflowHasFullShares = workflowRoyalty === "100";
  const workflowCanSetPrice = isWorkflowArtist && !workflowFinalized && workflowHasFullShares;
  const workflowHasPrice = Number(workflowPrice) > 0;

  async function connectWallet() {
    try {

      console.log("Connect button clicked");

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      console.log("MetaMask detected");

      const provider = new BrowserProvider(window.ethereum);

      console.log("Requesting MetaMask accounts...");

      await provider.send("eth_requestAccounts", []);

      console.log("MetaMask connected");

      const signer = await provider.getSigner();

      const address = await signer.getAddress();

      console.log("Wallet address:", address);

      setAccount(address);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log("Reading songCount...");

      const count = await contract.songCount();

      console.log("Song count:", count.toString());

      setSongCount(count.toString());
      if (count > 0n && BigInt(selectedSongId) > count) {
        setSelectedSongId(count.toString());
      }

    } catch (error) {

      console.error("Connection error:", error);

      alert(
        "Error connecting to MetaMask. Check the browser console."
      );
    }
  }

  async function checkLicenseStatus() {
    if (!window.ethereum || !songCount || Number(songCount) === 0) {
      return;
    }

    try {
      const provider =
        new BrowserProvider(window.ethereum!);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const licenseStatus = account
        ? await contract.hasLicense(Number(selectedSongId), account)
        : false;
      setHasLicense(licenseStatus);
      const price = await contract.licensePrices(Number(selectedSongId));
      setCurrentLicensePrice(formatEther(price));
      setSelectedSongFinalized(await contract.isFinalized(Number(selectedSongId)));
      if (licenseStatus && account) {
        await loadLatestPurchaseReceipt(selectedSongId, account);
      }

    } catch (error) {
      console.error(
        "Failed to read license status:",
        error
      );
    }
  }

  async function loadLatestPurchaseReceipt(songId: string, buyer: string) {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const purchaseEvents = await contract.queryFilter(
        contract.filters.LicensePurchased(),
        0,
        "latest"
      );

      for (const event of [...purchaseEvents].reverse()) {
        let parsed;
        try {
          parsed = contract.interface.parseLog({ topics: event.topics, data: event.data });
        } catch {
          continue;
        }
        if (
          parsed?.name !== "LicensePurchased" ||
          String(parsed.args.songId) !== songId ||
          String(parsed.args.buyer).toLowerCase() !== buyer.toLowerCase()
        ) continue;

        const receipt = await provider.getTransactionReceipt(event.transactionHash);
        if (!receipt) continue;
        const payouts = receipt.logs.flatMap((log: Log) => {
          try {
            const payoutEvent = contract.interface.parseLog(log);
            if (payoutEvent?.name !== "RoyaltyPaid") return [];
            const wallet = String(payoutEvent.args.contributor);
            return [{
              wallet,
              role: "Contributor",
              amount: formatEther(BigInt(payoutEvent.args.amount)),
            }];
          } catch {
            return [];
          }
        });

        let payoutEvidence: "events" | "shares" = "events";
        if (payouts.length === 0) {
          payoutEvidence = "shares";
          const price = BigInt(parsed.args.amount);
          for (let index = 0; index < 100; index++) {
            try {
              const contributor = await contract.contributors(Number(songId), index);
              const wallet = String(contributor[0]);
              const role = String(contributor[1]);
              const share = BigInt(contributor[2]);
              payouts.push({ wallet, role, amount: formatEther((price * share) / 100n) });
            } catch {
              break;
            }
          }
        }

        const priorBalance = event.blockNumber > 0
          ? await provider.getBalance(buyer, event.blockNumber - 1)
          : 0n;
        const balanceAfter = await provider.getBalance(buyer, event.blockNumber);
        const gasFee = receipt.gasUsed * receipt.gasPrice;
        const track = await contract.songs(Number(songId));
        setPurchaseReceipt({
          songId,
          title: String(track[1]),
          buyer,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          licenseAmount: formatEther(BigInt(parsed.args.amount)),
          gasFee: formatEther(gasFee),
          balanceBefore: formatEther(priorBalance),
          balanceAfter: formatEther(balanceAfter),
          payouts,
          payoutEvidence,
        });
        return;
      }
    } catch (error) {
      console.error("Could not restore the license receipt from chain history:", error);
    }
  }
  useEffect(() => {
    setPurchaseStatus("");
    setHasLicense(false);
    if (!songCount || Number(songCount) === 0) {
      setCurrentLicensePrice("0");
      setSelectedSongFinalized(false);
      return;
    }
    checkLicenseStatus();
  }, [account, selectedSongId, songCount]);

  useEffect(() => {
    if (!account || !window.ethereum) {
      setWalletBalance("");
      return;
    }
    const provider = new BrowserProvider(window.ethereum);
    provider.getBalance(account).then((balance) => {
      setWalletBalance(formatEther(balance));
    }).catch((error) => {
      console.error("Could not read wallet balance:", error);
      setWalletBalance("");
    });
  }, [account, purchaseReceipt]);

  async function loadWorkflowTrack(songId: string) {
    if (!songId || !window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [track, finalized, totalShares, price] = await Promise.all([
        contract.songs(Number(songId)),
        contract.isFinalized(Number(songId)),
        contract.totalRoyaltyShares(Number(songId)),
        contract.licensePrices(Number(songId)),
      ]);

      setWorkflowSongId(songId);
      setWorkflowSongTitle(track[1]);
      setWorkflowArtist(track[2]);
      setWorkflowFinalized(finalized);
      setWorkflowRoyalty(totalShares.toString());
      setWorkflowPrice(formatEther(price));
      setLicensePrice(price === 0n ? "" : formatEther(price));

      const loadedContributors = [];
      for (let index = 0; index < 10; index++) {
        try {
          const contributor = await contract.contributors(Number(songId), index);
          loadedContributors.push({
            wallet: contributor[0],
            role: contributor[1],
            royaltyShare: contributor[2].toString(),
          });
        } catch {
          break;
        }
      }
      setWorkflowContributors(loadedContributors);
      setWorkflowStatus("");
    } catch (error) {
      console.error("Could not load artist track:", error);
      setWorkflowStatus("Could not load this track from the contract.");
    }
  }

  async function refreshArtistTracks() {
    if (!account || !songCount || !window.ethereum) {
      setArtistSongIds([]);
      setWorkflowSongId("");
      setWorkflowSongTitle("");
      setWorkflowArtist("");
      setWorkflowContributors([]);
      setWorkflowRoyalty("0");
      setWorkflowPrice("0");
      setWorkflowFinalized(false);
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const ownedTracks: string[] = [];

      for (let id = 1; id <= Number(songCount); id++) {
        const track = await contract.songs(id);
        if (track[2].toLowerCase() === account.toLowerCase()) {
          ownedTracks.push(String(id));
        }
      }

      setArtistSongIds(ownedTracks);
      if (ownedTracks.length === 0) {
        setWorkflowSongId("");
        setWorkflowSongTitle("");
        setWorkflowArtist("");
        setWorkflowContributors([]);
        setWorkflowRoyalty("0");
        setWorkflowPrice("0");
        setWorkflowFinalized(false);
        return;
      }

      const selectedTrack = ownedTracks.includes(workflowSongId)
        ? workflowSongId
        : ownedTracks[ownedTracks.length - 1];
      setWorkflowSongId(selectedTrack);
      await loadWorkflowTrack(selectedTrack);
    } catch (error) {
      console.error("Could not load artist tracks:", error);
      setWorkflowStatus("Could not load your tracks. Check the wallet network.");
    }
  }

  useEffect(() => {
    refreshArtistTracks();
  }, [account, songCount]);


  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const ethereum = window.ethereum as typeof window.ethereum & {
      on: (event: "accountsChanged", listener: (accounts: string[]) => void) => void;
      removeListener: (event: "accountsChanged", listener: (accounts: string[]) => void) => void;
    };

    const handleAccountsChanged = (
      accounts: string[]
    ) => {
      if (accounts.length === 0) {
        setAccount("");
        setHasLicense(false);
        return;
      }

      setAccount(accounts[0]);
    };

    ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  async function registerSong() {
    if (isRegistering) return;

    try {

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      if (!account) {
        alert("Please connect MetaMask first!");
        return;
      }

      if (!title.trim() || !audioFile) {
        alert("Please enter a song title and choose an audio file.");
        return;
      }

      if (!audioFile.type.startsWith("audio/")) {
        alert("Please choose a valid audio file.");
        return;
      }

      if (audioFile.size > 50 * 1024 * 1024) {
        alert("Audio file must be 50 MB or smaller.");
        return;
      }

      setIsRegistering(true);
      setStatus("Uploading song to Pinata...");

      const uploadResponse = await fetch("http://127.0.0.1:3001/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": audioFile.type,
          "X-File-Name": encodeURIComponent(audioFile.name),
        },
        body: audioFile,
      });

      const uploadResult: { cid?: string; error?: string } =
        await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.cid) {
        throw new Error(uploadResult.error || "The audio upload failed.");
      }

      setStatus("Song uploaded. Waiting for MetaMask confirmation...");
      const provider = new BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      console.log("Registering song...");

      const transaction = await contract.registerSong(
        title.trim(),
        uploadResult.cid
      );

      console.log(
        "Transaction sent:",
        transaction.hash
      );

      setStatus(
        "Transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      console.log(
        "Song registered successfully!"
      );

      setStatus(
        "Song registered successfully!"
      );

      const updatedCount =
        await contract.songCount();

      setSongCount(
        updatedCount.toString()
      );
      setSelectedSongId(updatedCount.toString());
      setSong(null);
      setContributors([]);
      setHasLicense(false);

      setTitle("");
      setAudioFile(null);
      if (audioInputRef.current) audioInputRef.current.value = "";

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );

      setStatus(error instanceof Error
        ? `Song registration failed: ${error.message}`
        : "Song registration failed.");
    } finally {
      setIsRegistering(false);
    }
  }

  async function readSong() {
    try {

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const provider =
        new BrowserProvider(window.ethereum);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log(`Reading Song #${selectedSongId}...`);

      const result =
        await contract.songs(Number(selectedSongId));

      console.log(`Song #${selectedSongId}:`, result);

      setSong({
        id: result[0].toString(),
        title: result[1],
        artist: result[2],
        ipfsCID: result[3]
      });

    } catch (error) {

      console.error(
        "Error reading song:",
        error
      );
    }
  }

  async function finalizeWorkflowTrack() {
    if (!workflowSongId || !window.ethereum) return;
    if (!isWorkflowArtist) {
      setFinalizeStatus("Only this track’s artist can finalize it.");
      return;
    }
    if (!workflowHasFullShares || !workflowHasPrice) {
      setFinalizeStatus("Allocate 100% of royalties and set a price first.");
      return;
    }

    try {
      setFinalizeStatus("Waiting for MetaMask confirmation...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const transaction = await contract.finalizeSong(Number(workflowSongId));
      setFinalizeStatus("Finalizing track...");
      await transaction.wait();
      setWorkflowFinalized(true);
      setFinalizeStatus("Track finalized. Contributors and price are now locked.");
    } catch (error) {
      console.error("Track finalization failed:", error);
      setFinalizeStatus(error instanceof Error ? error.message : "Could not finalize track.");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="RagaChain home">
          <span className="brand-mark">R</span>
          <span>RagaChain</span>
        </a>
        <div className="wallet-area">
          {account && <span className="wallet-address" title={account}>{`${account.slice(0, 6)}…${account.slice(-4)}`}</span>}
          <button className={account ? "button button-connected" : "button button-dark"} onClick={connectWallet}>
            {account ? "Wallet connected" : "Connect wallet"}
          </button>
        </div>
      </header>

      <main id="top" className="dashboard">
        <section className="welcome-panel">
          <div className="welcome-copy">
            <p className="eyebrow">THE CREATOR’S STUDIO</p>
            <h1>Your music.<br /><span>Your rights.</span></h1>
            <p className="welcome-description">Register tracks, credit collaborators, and manage licenses from one place.</p>
          </div>
          <div className="welcome-stats">
            <div className="stat-card">
              <span className="stat-label">Registered tracks</span>
              <strong>{songCount || "—"}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Wallet</span>
              <strong className="stat-wallet">{account ? "Connected" : "Not connected"}</strong>
              {account && <span className="stat-balance">{walletBalance ? `${Number(walletBalance).toFixed(4)} ETH` : "Balance loading…"}</span>}
            </div>
          </div>
          <span className="sound-orbit orbit-one" aria-hidden="true" />
          <span className="sound-orbit orbit-two" aria-hidden="true" />
        </section>

        <section className="artist-workflow">
          <div className="workflow-heading">
            <div>
              <p className="eyebrow">ARTIST WORKFLOW</p>
              <h2>Prepare your release</h2>
              <p>Complete each step in order. Only the artist wallet can edit a release before finalization.</p>
              {workflowSongId && <p className="workflow-current-title">Editing Track #{workflowSongId}: {workflowSongTitle}{workflowFinalized ? " · Finalized" : " · Draft"}</p>}
            </div>
            {artistSongIds.length > 0 && (
              <div className="workflow-track-picker">
                <label htmlFor="workflow-track">Continue your track</label>
                <select id="workflow-track" className="text-input" value={workflowSongId} onChange={(event) => loadWorkflowTrack(event.target.value)}>
                  {artistSongIds.map((id) => <option key={id} value={id}>Track #{id}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="workflow-grid">
            <section className="card workflow-card">
              <div className="section-heading">
                <div><p className="eyebrow">NEW RELEASE</p><h2>Register a track</h2></div>
                <span className="step-badge">01</span>
              </div>
              <p className="section-description">Upload audio and create your on-chain draft.</p>
              <label className="field-label" htmlFor="song-title">Track title</label>
              <input id="song-title" className="text-input" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Naina Morey" />
              <label className="field-label file-label" htmlFor="song-audio">Audio file <span>50 MB max</span></label>
              <label className={`upload-dropzone${audioFile ? " has-file" : ""}`} htmlFor="song-audio">
                <span className="upload-icon" aria-hidden="true">↑</span>
                <span className="upload-prompt">{audioFile ? audioFile.name : "Choose an audio file"}</span>
                <span className="upload-hint">{audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB · ready to upload` : "MP3, WAV or other audio"}</span>
                <input id="song-audio" ref={audioInputRef} type="file" accept="audio/*" onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)} />
              </label>
              <button className="button button-primary button-wide" onClick={registerSong} disabled={isRegistering || !account}>
                {isRegistering ? "Uploading & registering…" : "Upload & register track"}{!isRegistering && <span aria-hidden="true">↗</span>}
              </button>
              <p className="status-message" role="status" aria-live="polite">{status || "The track will be registered to your connected artist wallet."}</p>
            </section>

            <section className={`card workflow-card${(!isWorkflowArtist || !workflowSongId || workflowFinalized) ? " workflow-locked" : ""}`}>
              <div className="section-heading">
                <div><p className="eyebrow">SHARE THE CREDIT</p><h2>Add contributors</h2></div>
                <span className="step-badge">02</span>
              </div>
              <p className="section-description">Allocate all royalties before moving to price.</p>
              <div className="allocation-meter"><span style={{ width: `${Math.min(Number(workflowRoyalty), 100)}%` }} /></div>
              <p className="allocation-total"><strong>{workflowRoyalty}%</strong><span>of 100% allocated</span></p>
              <label className="field-label" htmlFor="contributor-wallet">Contributor wallet</label>
              <input id="contributor-wallet" className="text-input" type="text" value={contributorWallet} onChange={(event) => setContributorWallet(event.target.value)} placeholder="0x…" disabled={!isWorkflowArtist || workflowFinalized} />
              <div className="form-grid">
                <div className="field"><label className="field-label" htmlFor="contributor-role">Role</label><input id="contributor-role" className="text-input" type="text" value={contributorRole} onChange={(event) => setContributorRole(event.target.value)} placeholder="Singer, composer…" disabled={!isWorkflowArtist || workflowFinalized} /></div>
                <div className="field"><label className="field-label" htmlFor="royalty-share">Royalty share</label><div className="input-suffix"><input id="royalty-share" className="text-input" type="number" min="1" max={Math.max(0, 100 - Number(workflowRoyalty))} value={royaltyShare} onChange={(event) => setRoyaltyShare(event.target.value)} placeholder="40" disabled={!isWorkflowArtist || workflowFinalized} /><span>%</span></div></div>
              </div>
              <button className="button button-dark" onClick={addContributor} disabled={!isWorkflowArtist || workflowFinalized || !workflowSongId || workflowRoyalty === "100" || isAddingContributor}>{isAddingContributor ? "Adding contributor…" : "Add contributor"}</button>
              <p className="status-message" role="status">{workflowFinalized ? "Finalized — contributor shares are locked." : !isWorkflowArtist ? "Connect the artist wallet for this track to add contributors." : workflowStatus || contributorStatus || "Step 3 unlocks when the allocation reaches 100%."}</p>
              {workflowContributors.length > 0 && <div className="workflow-contributor-list">{workflowContributors.map((item, index) => <div className="workflow-contributor" key={`${item.wallet}-${index}`}><span>{item.role}</span><strong>{item.royaltyShare}%</strong></div>)}</div>}
            </section>

            <section className={`card workflow-card${!workflowCanSetPrice ? " workflow-locked" : ""}`}>
              <div className="section-heading">
                <div><p className="eyebrow">LICENSE SETTINGS</p><h2>Set a price</h2></div>
                <span className="step-badge">03</span>
              </div>
              <p className="section-description">Set what another wallet pays to license this track.</p>
              <label className="field-label" htmlFor="license-price">Price in ETH</label>
              <div className="input-suffix price-input">
                <input id="license-price" className="text-input" type="number" min="0.000000000000000001" step="0.001" value={licensePrice} onChange={(event) => setLicensePrice(event.target.value)} placeholder="0.1" disabled={!workflowCanSetPrice || workflowFinalized} />
                <span>ETH</span>
              </div>
              <button className="button button-dark" onClick={setSongLicensePrice} disabled={!workflowCanSetPrice || workflowFinalized || !licensePrice || Number(licensePrice) <= 0}>Save price</button>
              <p className="status-message" role="status">{workflowFinalized ? "Finalized — license price is locked." : !isWorkflowArtist ? "Only the artist wallet can set this price." : !workflowHasFullShares ? "Allocate 100% of royalties to unlock pricing." : licensePriceStatus || (workflowHasPrice ? `Saved price: ${workflowPrice} ETH` : "Choose a price to unlock final upload.")}</p>
            </section>
          </div>

          <div className="finalize-bar">
            <div><strong>{workflowFinalized ? "Release finalized" : "Ready to publish?"}</strong><p>{workflowFinalized ? "Contributor shares and price are permanently locked." : "Final upload locks the contributor list and license price on-chain."}</p>{finalizeStatus && <p className="finalize-status" role="status">{finalizeStatus}</p>}</div>
            <button className="button button-finalize" onClick={finalizeWorkflowTrack} disabled={!workflowCanSetPrice || !workflowHasPrice || workflowFinalized}>FINAL UPLOAD <span aria-hidden="true">↗</span></button>
          </div>
        </section>

        <section className="catalog-section">
          <div className="catalog-heading"><div><p className="eyebrow">ON-CHAIN CATALOG</p><h2>Explore registered tracks</h2><p>View track details and contributors, then purchase a license.</p></div><span className="section-icon" aria-hidden="true">♫</span></div>
          <div className="catalog-grid">
            <section className="card catalog-track-card">
              <h3>Track details</h3>
              <label className="field-label" htmlFor="song-selector">Select track</label>
              <div className="selector-row">
                <select id="song-selector" className="text-input" value={selectedSongId} onChange={(event) => { setSelectedSongId(event.target.value); setSong(null); setContributors([]); setHasLicense(false); setPurchaseStatus(""); setSelectedSongFinalized(false); }} disabled={!songCount || Number(songCount) === 0}>
                  {Array.from({ length: Number(songCount) || 0 }, (_, index) => index + 1).map((id) => <option key={id} value={id}>Track #{id}</option>)}
                  {(!songCount || Number(songCount) === 0) && <option value="1">No tracks yet</option>}
                </select>
                <button className="button button-secondary" onClick={readSong} disabled={!songCount || Number(songCount) === 0}>Load</button>
              </div>
              {song ? <div className="track-detail"><div className="track-cover" aria-hidden="true">♫</div><div className="track-meta"><span className="track-id">TRACK #{song.id}</span><h3>{song.title}</h3><p>Artist <span className="address-text">{song.artist}</span></p></div><audio className="track-audio" controls preload="none" src={`https://gateway.pinata.cloud/ipfs/${encodeURIComponent(song.ipfsCID)}`} aria-label={`Play ${song.title}`}><a href={`https://gateway.pinata.cloud/ipfs/${encodeURIComponent(song.ipfsCID)}`}>Download {song.title}</a></audio><div className="cid-block"><span>IPFS CONTENT ID</span><code title={song.ipfsCID}>{song.ipfsCID}</code></div></div> : <div className="empty-state"><span aria-hidden="true">♫</span><p>{Number(songCount) > 0 ? "Load a track to see its details." : "Registered tracks will appear here."}</p></div>}
            </section>

            <section className="card catalog-contributors-card">
              <div className="catalog-card-heading"><h3>Track contributors</h3><button className="text-button" onClick={readContributors} disabled={!songCount || Number(songCount) === 0}>Refresh list</button></div>
              {contributorReadStatus && <p className="status-message" role="status">{contributorReadStatus}</p>}
              {contributors.length > 0 ? <div className="contributor-list">{contributors.map((item, index) => <div className="contributor-row" key={`${item.wallet}-${index}`}><span className="avatar-bubble">{item.role.slice(0, 1).toUpperCase()}</span><div className="contributor-info"><strong>{item.role}</strong><span title={item.wallet}>{`${item.wallet.slice(0, 8)}…${item.wallet.slice(-6)}`}</span></div><strong className="share-value">{item.royaltyShare}%</strong></div>)}<div className="royalty-total"><span>Total allocated</span><strong>{totalRoyalty}%</strong></div></div> : <p className="subtle-empty">Choose a track and refresh to see its contributors.</p>}
            </section>

            <section className="card purchase-card">
              <div className="section-heading"><div><p className="eyebrow">LICENSE A TRACK</p><h2>Purchase access</h2></div><span className="section-icon" aria-hidden="true">◇</span></div>
              <p className="section-description">Buy a license for the selected track with your connected wallet.</p>
              <div className="price-summary"><span>Current price</span><strong>{currentLicensePrice} <small>ETH</small></strong></div>
              <button className="button button-primary button-wide" onClick={purchaseSongLicense} disabled={!selectedSongFinalized || hasLicense || isPurchasing || !account}>{hasLicense ? "Already licensed" : isPurchasing ? "Purchase pending…" : "Purchase license"}</button>
              {!selectedSongFinalized && <p className="status-message">Only finalized tracks can be licensed.</p>}
              {hasLicense && <p className="license-badge"><span aria-hidden="true">✓</span> This wallet is licensed</p>}
              <p className="status-message" role="status">{purchaseStatus}</p>
            </section>
          </div>
          {purchaseReceipt && (
            <section className="card transaction-receipt" aria-live="polite">
              <div className="receipt-heading">
                <div><p className="eyebrow">ON-CHAIN PROOF</p><h3>Latest license transaction</h3><p>Track #{purchaseReceipt.songId}: {purchaseReceipt.title} · Buyer {`${purchaseReceipt.buyer.slice(0, 8)}…${purchaseReceipt.buyer.slice(-6)}`}</p></div>
                <span className="receipt-confirmed">Confirmed · Block {purchaseReceipt.blockNumber}</span>
              </div>
              <div className="receipt-metrics">
                <div><span>License price</span><strong>{purchaseReceipt.licenseAmount} ETH</strong></div>
                <div><span>Gas fee</span><strong>{purchaseReceipt.gasFee} ETH</strong></div>
                <div><span>Buyer balance before</span><strong>{purchaseReceipt.balanceBefore} ETH</strong></div>
                <div><span>Buyer balance after</span><strong>{purchaseReceipt.balanceAfter} ETH</strong></div>
              </div>
              <div className="receipt-payouts">
                <h4>{purchaseReceipt.payoutEvidence === "events" ? "Contributor payouts recorded in this transaction" : "Contributor payouts calculated from the on-chain shares"}</h4>
                {purchaseReceipt.payouts.map((payout) => (
                  <div className="receipt-payout" key={payout.wallet}>
                    <span><strong>{payout.role}</strong><code title={payout.wallet}>{payout.wallet}</code></span>
                    <strong>{payout.amount} ETH</strong>
                  </div>
                ))}
                {purchaseReceipt.payouts.length === 0 && <p className="subtle-empty">No royalty payout events were found in this transaction.</p>}
              </div>
              <div className="receipt-transaction"><span>Transaction hash</span><code title={purchaseReceipt.transactionHash}>{purchaseReceipt.transactionHash}</code><button className="text-button" onClick={() => navigator.clipboard.writeText(purchaseReceipt.transactionHash)}>Copy hash</button></div>
            </section>
          )}
        </section>
        <footer className="page-footer"><span>RagaChain</span><span>Music rights, made clear.</span></footer>
      </main>
    </div>
  );

  async function readContributors() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    setContributorReadStatus(
      "Reading contributors..."
    );

    const provider = new BrowserProvider(window.ethereum);

    const contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

      const total = await contract.totalRoyaltyShares(Number(selectedSongId));

    const contributorList = [];

    for (let i = 0; i < 10; i++) {
      try {
        const contributor =
            await contract.contributors(Number(selectedSongId), i);

        contributorList.push({
          wallet: contributor[0],
          role: contributor[1],
          royaltyShare: contributor[2].toString()
        });
      } catch {
        break;
      }
    }

    setContributors(contributorList);
    setTotalRoyalty(total.toString());

    setContributorReadStatus(
      "Contributors loaded successfully!"
    );

  } catch (error) {
    console.error(
      "Error reading contributors:",
      error
    );

    setContributorReadStatus(
      "Failed to read contributors."
    );
  }
}

  async function setSongLicensePrice() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    if (!account) {
      alert("Please connect MetaMask first!");
      return;
    }

    if (!workflowSongId || !isWorkflowArtist || !workflowCanSetPrice || workflowFinalized) {
      setLicensePriceStatus("Only the artist can set a price after allocating 100% of royalties.");
      return;
    }

    if (!licensePrice || Number(licensePrice) <= 0) {
      alert("Please enter a license price.");
      return;
    }

    setLicensePriceStatus(
      "Waiting for MetaMask confirmation..."
    );

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    const priceInWei = parseEther(licensePrice);

    console.log(
      "Setting license price:",
      licensePrice,
      "ETH"
    );

    const transaction =
      await contract.setLicensePrice(
        Number(workflowSongId),
        priceInWei
      );

    console.log(
      "Transaction sent:",
      transaction.hash
    );

    setLicensePriceStatus(
      "Transaction submitted. Waiting for confirmation..."
    );

    await transaction.wait();

    setWorkflowPrice(licensePrice);

    console.log(
      "License price set successfully!"
    );

    setLicensePriceStatus(
      "License price set successfully!"
    );
    await loadWorkflowTrack(workflowSongId);

  } catch (error) {
    console.error(
      "License price error:",
      error
    );

    setLicensePriceStatus(
      "Failed to set license price."
    );
  }
}

  async function purchaseSongLicense() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    if (!account) {
      alert("Please connect MetaMask first!");
      return;
    }

    if (!selectedSongFinalized) {
      setPurchaseStatus("This track is not finalized yet.");
      return;
    }

    if (hasLicense) {
      setPurchaseStatus("This wallet already has a license for this track.");
      return;
    }

    setIsPurchasing(true);
    setPurchaseStatus(
      "Waiting for MetaMask confirmation..."
    );

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    const price = await contract.licensePrices(Number(selectedSongId));
    const balanceBefore = await provider.getBalance(account);
    const purchasedTrack = await contract.songs(Number(selectedSongId));

    console.log(
      "License price:",
      price.toString()
    );

    const transaction =
      await contract.purchaseLicense(Number(selectedSongId), {
        value: price
      });

    console.log(
      "Purchase transaction:",
      transaction.hash
    );

    setPurchaseStatus(
      "Transaction submitted. Waiting for confirmation..."
    );

    const receipt = await transaction.wait();
    if (!receipt) throw new Error("The transaction receipt was not available.");

    const payouts = receipt.logs.flatMap((log: Log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name !== "RoyaltyPaid") return [];
        const wallet = String(parsed.args.contributor);
        const amount = BigInt(parsed.args.amount);
        const role = contributors.find((item) => item.wallet.toLowerCase() === wallet.toLowerCase())?.role ?? "Contributor";
        return [{ wallet, role, amount: formatEther(amount) }];
      } catch {
        return [];
      }
    });
    let payoutEvidence: "events" | "shares" = "events";
    if (payouts.length === 0) {
      payoutEvidence = "shares";
      for (const contributor of contributors) {
        const share = BigInt(contributor.royaltyShare);
        payouts.push({
          wallet: contributor.wallet,
          role: contributor.role,
          amount: formatEther((price * share) / 100n),
        });
      }
    }
    const balanceAfter = await provider.getBalance(account);
    const gasFee = receipt.gasUsed * receipt.gasPrice;
    setPurchaseReceipt({
      songId: selectedSongId,
      title: purchasedTrack[1],
      buyer: account,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      licenseAmount: formatEther(price),
      gasFee: formatEther(gasFee),
      balanceBefore: formatEther(balanceBefore),
      balanceAfter: formatEther(balanceAfter),
      payouts,
      payoutEvidence,
    });
    setWalletBalance(formatEther(balanceAfter));

    console.log(
      "License purchased successfully!"
    );

    const licenseStatus =
      await contract.hasLicense(
        Number(selectedSongId),
        account
      );

    setHasLicense(licenseStatus);

    setPurchaseStatus(
      "License purchased successfully!"
    );

  } catch (error) {
    console.error(
      "Purchase error:",
      error
    );

    setPurchaseStatus(
      "License purchase failed."
    );
  } finally {
    setIsPurchasing(false);
  }
}

  async function addContributor() {
    if (isAddingContributorRef.current) return;

    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      if (!account) {
        alert("Please connect MetaMask first!");
        return;
      }

      if (!workflowSongId || !isWorkflowArtist || workflowFinalized) {
        setContributorStatus("Only the artist can edit an unfinished track.");
        return;
      }

      if (
        !contributorWallet ||
        !contributorRole ||
        !royaltyShare
      ) {
        alert("Please fill all contributor fields.");
        return;
      }

      const requestedShare = Number(royaltyShare);
      if (!Number.isInteger(requestedShare) || requestedShare < 1 || requestedShare > 100 - Number(workflowRoyalty)) {
        setContributorStatus("Enter a royalty share within the remaining allocation.");
        return;
      }

      isAddingContributorRef.current = true;
      setIsAddingContributor(true);

      setContributorStatus(
        "Waiting for MetaMask confirmation..."
      );

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      console.log("Adding contributor...");

      const transaction = await contract.addContributor(
        Number(workflowSongId),
        contributorWallet,
        contributorRole,
        requestedShare
      );

      console.log(
        "Contributor transaction:",
        transaction.hash
      );

      setContributorStatus(
        "Transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      console.log("Contributor added successfully!");

      setContributorStatus(
        "Contributor added successfully!"
      );

      await loadWorkflowTrack(workflowSongId);

      setContributorWallet("");
      setContributorRole("");
      setRoyaltyShare("");

    } catch (error) {
      console.error(
        "Contributor error:",
        error
      );

      setContributorStatus(
        `Failed to add contributor: ${error instanceof Error ? error.message.split("\n")[0] : "the transaction was rejected or reverted."}`
      );
    } finally {
      isAddingContributorRef.current = false;
      setIsAddingContributor(false);
    }
  }
}

export default App;
