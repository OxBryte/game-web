import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ShareModal from "./ShareModal";

interface GameListProps {
  contract: ethers.Contract | null;
  account: string;
  onSelectGame: (gameId: number) => void;
}

interface Game {
  gameId: number;
  p1: string;
  p2: string;
  stake: string;
  createdAt: number;
  revealDeadline: number;
  settled: boolean;
  canJoin: boolean;
  isMyGame: boolean;
  status: string;
}

const GameList: React.FC<GameListProps> = ({
  contract,
  account,
  onSelectGame,
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGameForShare, setSelectedGameForShare] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (contract) {
      loadGames();
    }
  }, [contract]);

  const loadGames = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const nextGameId = await contract.nextGameId();
      const gamePromises = [];

      // Load last 20 games or all games if less than 20
      const startId = Math.max(0, nextGameId - 20);

      for (let i = startId; i < nextGameId; i++) {
        gamePromises.push(contract.games(i));
      }

      const gameResults = await Promise.all(gamePromises);

      const formattedGames: Game[] = gameResults
        .map((game, index) => {
          const gameId = startId + index;
          const isMyGame =
            game.p1.toLowerCase() === account.toLowerCase() ||
            game.p2.toLowerCase() === account.toLowerCase();
          const canJoin =
            game.p2 === ethers.constants.AddressZero &&
            game.p1.toLowerCase() !== account.toLowerCase() &&
            !game.settled;

          let status = "Unknown";
          if (game.settled) {
            status = "Finished";
          } else if (game.p2 === ethers.constants.AddressZero) {
            status = "Waiting for Player 2";
          } else if (game.revealDeadline > 0) {
            status = "Reveal Phase";
          } else {
            status = "Commit Phase";
          }

          return {
            gameId,
            p1: game.p1,
            p2: game.p2,
            stake: ethers.utils.formatEther(game.stake),
            createdAt: game.createdAt,
            revealDeadline: game.revealDeadline,
            settled: game.settled,
            canJoin,
            isMyGame,
            status,
          };
        })
        .reverse(); // Show newest first

      setGames(formattedGames);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (address === ethers.constants.AddressZero) return "Waiting...";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="px-5 max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-5"></div>
          <p>Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl text-gray-800 m-0">🎮 Active Games</h2>
          <button
            onClick={loadGames}
            className="bg-gray-50 border-2 border-gray-200 px-5 py-2.5 rounded-xl cursor-pointer transition-all duration-300 font-medium hover:bg-gray-200 hover:transform hover:-translate-y-0.5"
          >
            🔄 Refresh
          </button>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-5">🎯</div>
            <h3 className="text-2xl m-0 mb-2.5">No games found</h3>
            <p>Create a new game to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-5">
            {games.map((game) => (
              <div
                key={game.gameId}
                className={`bg-white rounded-2xl p-5 shadow-md transition-all duration-300 border-2 border-transparent hover:transform hover:-translate-y-0.5 hover:shadow-xl ${
                  game.isMyGame
                    ? "border-green-500 bg-gradient-to-br from-green-50 to-white"
                    : ""
                } ${
                  game.canJoin
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg text-gray-800">
                    Game #{game.gameId}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      game.status === "Waiting for Player 2"
                        ? "bg-yellow-100 text-yellow-800"
                        : game.status === "Reveal Phase"
                        ? "bg-blue-100 text-blue-800"
                        : game.status === "Finished"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {game.status}
                  </span>
                </div>

                <div className="mb-5">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-600">
                        Player 1:
                      </span>
                      <span className="font-mono text-gray-800">
                        {formatAddress(game.p1)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-600">
                        Player 2:
                      </span>
                      <span className="font-mono text-gray-800">
                        {formatAddress(game.p2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-600">
                        Stake:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {game.stake} ETH
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-600">
                        Created:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatTime(game.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  {game.canJoin && (
                    <button
                      className="flex-1 px-3 py-3 border-none rounded-xl font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
                      onClick={() => onSelectGame(game.gameId)}
                    >
                      Join Game
                    </button>
                  )}
                  {game.isMyGame && (
                    <button
                      className="flex-1 px-3 py-3 border-none rounded-xl font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600 text-white hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30"
                      onClick={() => onSelectGame(game.gameId)}
                    >
                      View Game
                    </button>
                  )}
                  {!game.isMyGame && !game.canJoin && (
                    <button
                      className="flex-1 px-3 py-3 border-2 border-gray-200 rounded-xl font-semibold cursor-pointer transition-all duration-300 bg-gray-50 text-gray-600 hover:bg-gray-200 hover:transform hover:-translate-y-0.5"
                      onClick={() => onSelectGame(game.gameId)}
                    >
                      Spectate
                    </button>
                  )}

                  {/* Share button for games that can be joined or are mine */}
                  {(game.canJoin || game.isMyGame) && (
                    <button
                      className="px-3 py-3 border-2 border-primary rounded-xl font-semibold cursor-pointer transition-all duration-300 bg-white text-primary hover:bg-primary hover:text-white hover:transform hover:-translate-y-0.5"
                      onClick={() => {
                        setSelectedGameForShare(game.gameId);
                        setShowShareModal(true);
                      }}
                      title="Share this game"
                    >
                      📤
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gameId={selectedGameForShare}
        gameUrl={`${window.location.origin}/game/${selectedGameForShare}`}
      />
    </>
  );
};

export default GameList;
