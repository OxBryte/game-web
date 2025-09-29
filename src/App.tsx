import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ethers } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";
import GameDetail from "./pages/GameDetail";
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";

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
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  const [, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
  useEffect(() => {
    const initializeContract = async () => {
      if (isConnected && address && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(provider);

          if (contractAddress) {
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

            // Request account access to ensure we have the right account
            await window.ethereum.request({ method: "eth_requestAccounts" });

            const signer = provider.getSigner();
            const contractInstance = new ethers.Contract(
              contractAddress,
              contractABI,
              signer
            );
            setContract(contractInstance);
          }
        } catch (error) {
          console.error("Error initializing contract:", error);
        }
      }
    };

    initializeContract();
  }, [isConnected, address, contractAddress]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200">
        <ConnectWallet />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-200">
        <header className="bg-white px-5 py-5 shadow-lg flex justify-between items-center sticky top-0 z-50">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent m-0">
            🎮 Rock Paper Scissors
          </h1>
          <div className="flex items-center gap-2.5">
            <span className="bg-gray-50 px-4 py-2 rounded-full font-mono text-sm text-gray-600 border-2 border-gray-200">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={<Home contract={contract} account={address || ""} />}
          />
          <Route
            path="/create"
            element={<CreateGame contract={contract} account={address || ""} />}
          />
          <Route
            path="/game/:id"
            element={<GameDetail contract={contract} account={address || ""} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
