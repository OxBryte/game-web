import React from "react";
import { useNavigate } from "react-router-dom";
import GameList from "../components/GameList";
import { ethers } from "ethers";

interface HomeProps {
  contract: ethers.Contract | null;
  account: string;
}

const Home: React.FC<HomeProps> = ({ contract, account }) => {
  const navigate = useNavigate();

  const handleSelectGame = (gameId: number) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200">
      <div className="bg-white px-5 py-5 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent m-0">
          🎮 Rock Paper Scissors
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/create")}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            + Create Game
          </button>
        </div>
      </div>

      <main className="flex-1 py-5 animate-fade-in">
        <GameList
          contract={contract}
          account={account}
          onSelectGame={handleSelectGame}
        />
      </main>
    </div>
  );
};

export default Home;
