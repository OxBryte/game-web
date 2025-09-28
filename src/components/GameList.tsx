import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./GameList.css";

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
      <div className="game-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-list">
      <div className="list-header">
        <h2>🎮 Active Games</h2>
        <button onClick={loadGames} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No games found</h3>
          <p>Create a new game to get started!</p>
        </div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <div
              key={game.gameId}
              className={`game-card ${game.isMyGame ? "my-game" : ""} ${
                game.canJoin ? "joinable" : ""
              }`}
            >
              <div className="game-header">
                <span className="game-id">Game #{game.gameId}</span>
                <span
                  className={`status ${game.status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {game.status}
                </span>
              </div>

              <div className="game-info">
                <div className="players">
                  <div className="player">
                    <span className="label">Player 1:</span>
                    <span className="address">{formatAddress(game.p1)}</span>
                  </div>
                  <div className="player">
                    <span className="label">Player 2:</span>
                    <span className="address">{formatAddress(game.p2)}</span>
                  </div>
                </div>

                <div className="game-details">
                  <div className="detail">
                    <span className="label">Stake:</span>
                    <span className="value">{game.stake} ETH</span>
                  </div>
                  <div className="detail">
                    <span className="label">Created:</span>
                    <span className="value">{formatTime(game.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="game-actions">
                {game.canJoin && (
                  <button
                    className="join-button"
                    onClick={() => onSelectGame(game.gameId)}
                  >
                    Join Game
                  </button>
                )}
                {game.isMyGame && (
                  <button
                    className="view-button"
                    onClick={() => onSelectGame(game.gameId)}
                  >
                    View Game
                  </button>
                )}
                {!game.isMyGame && !game.canJoin && (
                  <button
                    className="spectate-button"
                    onClick={() => onSelectGame(game.gameId)}
                  >
                    Spectate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameList;
