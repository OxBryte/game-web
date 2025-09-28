import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import { ethers } from "ethers";

interface GameDetailProps {
  contract: ethers.Contract | null;
  account: string;
}

const GameDetail: React.FC<GameDetailProps> = ({ contract, account }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = id ? parseInt(id, 10) : null;

  const handleGameCreated = (newGameId: number) => {
    // This shouldn't happen in game detail view, but just in case
    navigate(`/game/${newGameId}`);
  };

  if (!gameId || isNaN(gameId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Game Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The game you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200">
      <div className="bg-white px-5 py-5 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent m-0">
          🎮 Game #{gameId}
        </h1>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Games
        </button>
      </div>

      <main className="flex-1 py-5 animate-fade-in">
        <GameBoard
          contract={contract}
          account={account}
          gameId={gameId}
          mode="play"
          onGameCreated={handleGameCreated}
        />
      </main>
    </div>
  );
};

export default GameDetail;
