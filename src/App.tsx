import { useState, useEffect } from "react";
import { ethers } from "ethers";
import GameBoard from "./components/GameBoard";
import ConnectWallet from "./components/ConnectWallet";
import GameList from "./components/GameList";

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200">
        <ConnectWallet onConnect={connectWallet} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-200">
      <header className="bg-white px-5 py-5 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent m-0">
          🎮 Rock Paper Scissors
        </h1>
        <div className="flex items-center gap-2.5">
          <span className="bg-gray-50 px-4 py-2 rounded-full font-mono text-sm text-gray-600 border-2 border-gray-200">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      </header>

      <nav className="bg-white flex border-b border-gray-200 px-5">
        <button
          className={`bg-transparent border-none px-6 py-4 cursor-pointer text-base font-medium text-gray-600 border-b-3 border-transparent transition-all duration-300 hover:text-primary hover:bg-gray-50 ${
            currentView === "home"
              ? "text-primary border-b-primary bg-blue-50"
              : ""
          }`}
          onClick={() => setCurrentView("home")}
        >
          Games
        </button>
        <button
          className={`bg-transparent border-none px-6 py-4 cursor-pointer text-base font-medium text-gray-600 border-b-3 border-transparent transition-all duration-300 hover:text-primary hover:bg-gray-50 ${
            currentView === "create"
              ? "text-primary border-b-primary bg-blue-50"
              : ""
          }`}
          onClick={() => setCurrentView("create")}
        >
          Create Game
        </button>
      </nav>

      <main className="flex-1 py-5 animate-fade-in">
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
