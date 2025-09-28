import React from "react";
import { useNavigate } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import { ethers } from "ethers";

interface CreateGameProps {
  contract: ethers.Contract | null;
  account: string;
}

const CreateGame: React.FC<CreateGameProps> = ({ contract, account }) => {
  const navigate = useNavigate();

  const handleGameCreated = (gameId: number) => {
    // Navigate to the specific game page
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200">
      <div className="bg-white px-5 py-5 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent m-0">
          🎮 Rock Paper Scissors
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
          gameId={null}
          mode="create"
          onGameCreated={handleGameCreated}
        />
      </main>
    </div>
  );
};

export default CreateGame;
