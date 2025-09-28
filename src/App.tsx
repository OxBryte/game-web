import { useState, useEffect } from "react";
import { ethers } from "ethers";
import GameBoard from "./components/GameBoard";
import ConnectWallet from "./components/ConnectWallet";
import GameList from "./components/GameList";
import "./App.css";

export interface GameData {
  gameId: number;
  p1: string;
  p2: string;
  stake: string;
  createdAt: number;
  revealDeadline: number;
  settled: boolean;
  p1Move: number;
  p2Move: number;
}

function App() {
  const [account, setAccount] = useState<string>("");
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [currentView, setCurrentView] = useState<
    "home" | "create" | "join" | "game"
  >("home");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
  const contractABI = [
    "function create(bytes32 commit) external payable returns (uint256 gameId)",
    "function join(uint256 gameId, bytes32 commit) external payable",
    "function reveal(uint256 gameId, uint8 moveRaw, bytes32 salt) external",
    "function claimTimeout(uint256 gameId) external",
    "function cancelIfNoOpponent(uint256 gameId) external",
    "function games(uint256) external view returns (address p1, address p2, uint128 stake, uint40 createdAt, uint40 revealDeadline, bytes32 p1Commit, bytes32 p2Commit, uint8 p1Move, uint8 p2Move, bool settled)",
    "function computeCommit(uint8 moveRaw, bytes32 salt, address player) external pure returns (bytes32)",
    "function nextGameId() external view returns (uint256)",
    "event GameCreated(uint256 indexed gameId, address indexed p1, uint128 stake)",
    "event GameJoined(uint256 indexed gameId, address indexed p2)",
    "event BothCommitted(uint256 indexed gameId)",
    "event Revealed(uint256 indexed gameId, address indexed player, uint8 move)",
    "event Settled(uint256 indexed gameId, address winner, uint256 p1Payout, uint256 p2Payout, uint256 fee)",
  ];

  useEffect(() => {
    if (provider && contractAddress) {
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(contractInstance);
    }
  }, [provider, contractAddress]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setProvider(provider);
        setAccount(address);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const selectGame = (gameId: number) => {
    setSelectedGameId(gameId);
    setCurrentView("game");
  };

  if (!account) {
    return (
      <div className="app">
        <ConnectWallet onConnect={connectWallet} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Rock Paper Scissors</h1>
        <div className="wallet-info">
          <span>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={currentView === "home" ? "active" : ""}
          onClick={() => setCurrentView("home")}
        >
          Games
        </button>
        <button
          className={currentView === "create" ? "active" : ""}
          onClick={() => setCurrentView("create")}
        >
          Create Game
        </button>
      </nav>

      <main className="main-content">
        {currentView === "home" && (
          <GameList
            contract={contract}
            account={account}
            onSelectGame={selectGame}
          />
        )}

        {(currentView === "create" || currentView === "game") && (
          <GameBoard
            contract={contract}
            account={account}
            gameId={selectedGameId}
            mode={currentView === "create" ? "create" : "play"}
            onGameCreated={(gameId) => {
              setSelectedGameId(gameId);
              setCurrentView("game");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
