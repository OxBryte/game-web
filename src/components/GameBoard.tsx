import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ShareModal from "./ShareModal";

interface GameBoardProps {
  contract: ethers.Contract | null;
  account: string;
  gameId: number | null;
  mode: "create" | "play";
  onGameCreated: (gameId: number) => void;
}

enum Move {
  None = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3,
}

interface GameState {
  p1: string;
  p2: string;
  stake: string;
  createdAt: number;
  revealDeadline: number;
  settled: boolean;
  p1Move: Move;
  p2Move: Move;
  p1Commit: string;
  p2Commit: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  contract,
  account,
  gameId,
  mode,
  onGameCreated,
}) => {
  const [selectedMove, setSelectedMove] = useState<Move>(Move.None);
  const [stake, setStake] = useState("0.001");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [salt, setSalt] = useState("");
  const [phase, setPhase] = useState<
    "create" | "waiting" | "commit" | "reveal" | "finished"
  >("create");
  const [, setMyCommit] = useState("");
  const [revealMoveState, setRevealMoveState] = useState<Move>(Move.None);
  const [revealSalt, setRevealSalt] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdGameId, setCreatedGameId] = useState<number | null>(null);

  useEffect(() => {
    const loadGameState = async () => {
      if (!contract || gameId === null) return;

      try {
        setLoading(true);
        const game = await contract.games(gameId);
        const state: GameState = {
          p1: game.p1,
          p2: game.p2,
          stake: ethers.utils.formatEther(game.stake),
          createdAt: game.createdAt.toNumber(),
          revealDeadline: game.revealDeadline.toNumber(),
          settled: game.settled,
          p1Move: game.p1Move,
          p2Move: game.p2Move,
          p1Commit: game.p1Commit,
          p2Commit: game.p2Commit,
        };

        setGameState(state);

        // Determine phase
        if (state.settled) {
          setPhase("finished");
        } else if (state.p2 === ethers.constants.AddressZero) {
          // Game is waiting for second player
          if (state.p1.toLowerCase() === account.toLowerCase()) {
            setPhase("waiting"); // Creator is waiting
          } else {
            setPhase("commit"); // Other player can join
          }
        } else if (
          state.revealDeadline > 0 &&
          (state.p1Move === Move.None || state.p2Move === Move.None)
        ) {
          setPhase("reveal");
        } else {
          setPhase("finished");
        }
      } catch (error) {
        console.error("Error loading game state:", error);
        setPhase("finished"); // Fallback to finished if game doesn't exist
      } finally {
        setLoading(false);
      }
    };

    if (mode === "create") {
      setPhase("create");
    } else if (gameId !== null && contract) {
      loadGameState();
    }
  }, [gameId, contract, mode, account]);

  useEffect(() => {
    // Generate random salt when component mounts
    setSalt(ethers.utils.hexlify(ethers.utils.randomBytes(32)));
  }, []);

  const createGame = async () => {
    if (!contract || selectedMove === Move.None) return;

    try {
      setLoading(true);

      // Generate commit hash
      const commit = await contract.computeCommit(selectedMove, salt, account);
      setMyCommit(commit);

      // Create game
      const tx = await contract.create(commit, {
        value: ethers.utils.parseEther(stake),
      });

      const receipt = await tx.wait();
      const gameCreatedEvent = receipt.events?.find(
        (e: { event: string; args: { gameId: { toNumber: () => number } } }) =>
          e.event === "GameCreated"
      );

      if (gameCreatedEvent) {
        const newGameId = gameCreatedEvent.args.gameId.toNumber();
        setCreatedGameId(newGameId);
        setShowShareModal(true);
        onGameCreated(newGameId);
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Error creating game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (
      !contract ||
      gameId === null ||
      selectedMove === Move.None ||
      !gameState
    )
      return;

    try {
      setLoading(true);

      // Generate commit hash
      const commit = await contract.computeCommit(selectedMove, salt, account);
      setMyCommit(commit);

      // Join game
      const tx = await contract.join(gameId, commit, {
        value: ethers.utils.parseEther(gameState.stake),
      });

      await tx.wait();
      // Game state will be reloaded automatically
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Error joining game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitReveal = async () => {
    if (
      !contract ||
      gameId === null ||
      revealMoveState === Move.None ||
      !revealSalt
    )
      return;

    try {
      setLoading(true);

      const tx = await contract.reveal(gameId, revealMoveState, revealSalt);
      await tx.wait();
      // Game state will be reloaded automatically
    } catch (error) {
      console.error("Error revealing move:", error);
      alert("Error revealing move. Please check your move and salt.");
    } finally {
      setLoading(false);
    }
  };

  const getMoveIcon = (move: Move) => {
    switch (move) {
      case Move.Rock:
        return "🪨";
      case Move.Paper:
        return "📄";
      case Move.Scissors:
        return "✂️";
      default:
        return "❓";
    }
  };

  const getMoveName = (move: Move) => {
    switch (move) {
      case Move.Rock:
        return "Rock";
      case Move.Paper:
        return "Paper";
      case Move.Scissors:
        return "Scissors";
      default:
        return "None";
    }
  };

  const getWinner = () => {
    if (
      !gameState ||
      gameState.p1Move === Move.None ||
      gameState.p2Move === Move.None
    ) {
      return null;
    }

    if (gameState.p1Move === gameState.p2Move) return "tie";

    if (
      (gameState.p1Move === Move.Rock && gameState.p2Move === Move.Scissors) ||
      (gameState.p1Move === Move.Scissors && gameState.p2Move === Move.Paper) ||
      (gameState.p1Move === Move.Paper && gameState.p2Move === Move.Rock)
    ) {
      return "p1";
    }

    return "p2";
  };

  const isMyTurn = () => {
    if (!gameState) return false;

    const isP1 = gameState.p1.toLowerCase() === account.toLowerCase();
    const isP2 = gameState.p2.toLowerCase() === account.toLowerCase();

    if (phase === "reveal") {
      return (
        (isP1 && gameState.p1Move === Move.None) ||
        (isP2 && gameState.p2Move === Move.None)
      );
    }

    return false;
  };

  // Show loading state while game state is being loaded
  if (loading && mode === "play" && gameId !== null) {
    return (
      <>
        <div className="px-5 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-5"></div>
              <p>Loading game...</p>
            </div>
          </div>
        </div>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          gameId={createdGameId}
          gameUrl={`${window.location.origin}/game/${createdGameId}`}
        />
      </>
    );
  }

  if (phase === "create") {
    return (
      <>
        <div className="px-5 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <h2 className="text-3xl m-0 mb-8 text-gray-800">
              🎮 Create New Game
            </h2>

            <div className="mb-8">
              <label className="block font-semibold mb-2.5 text-gray-600">
                Stake Amount (ETH):
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="0.001"
                className="w-52 px-3 py-3 border-2 border-gray-200 rounded-xl text-lg text-center focus:outline-none focus:border-primary"
              />
            </div>

            <div className="mb-8">
              <h3 className="text-xl mb-5 text-gray-600">Choose Your Move:</h3>
              <div className="flex justify-center gap-5 flex-wrap">
                {[Move.Rock, Move.Paper, Move.Scissors].map((move) => (
                  <button
                    key={move}
                    className={`bg-white border-3 rounded-2xl p-5 cursor-pointer transition-all duration-300 min-w-32 flex flex-col items-center gap-2.5 hover:border-primary hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 ${
                      selectedMove === move
                        ? "border-primary bg-gradient-to-br from-primary to-primary-dark text-white transform -translate-y-0.5 shadow-lg shadow-primary/30"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedMove(move)}
                  >
                    <span className="text-4xl">{getMoveIcon(move)}</span>
                    <span className="font-semibold text-lg">
                      {getMoveName(move)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              className="px-8 py-4 border-none rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 min-w-52 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              onClick={createGame}
              disabled={loading || selectedMove === Move.None}
            >
              {loading ? "Creating..." : `Create Game (${stake} ETH)`}
            </button>
          </div>
        </div>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          gameId={createdGameId}
          gameUrl={`${window.location.origin}/game/${createdGameId}`}
        />
      </>
    );
  }

  if (phase === "waiting" && gameState) {
    return (
      <>
        <div className="px-5 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <h2 className="text-3xl m-0 mb-8 text-gray-800">
              🎮 Game #{gameId}
            </h2>

            <div className="mb-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-semibold text-yellow-800">
                  Waiting for Player 2
                </h3>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600">
                    Player 1 (You):
                  </span>
                  <span className="font-mono text-gray-800">
                    {gameState.p1.slice(0, 6)}...{gameState.p1.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600">Player 2:</span>
                  <span className="font-mono text-gray-500 italic">
                    Waiting for opponent...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600">Stake:</span>
                  <span className="font-semibold text-gray-800">
                    {gameState.stake} ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-gray-600 mb-4">
                Share this game with a friend to invite them to play!
              </p>
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                📤 Share Game
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                The game will start automatically when someone joins
              </p>
            </div>
          </div>
        </div>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          gameId={gameId}
          gameUrl={`${window.location.origin}/game/${gameId}`}
        />
      </>
    );
  }

  if (phase === "commit" && gameState) {
    const canJoin =
      gameState.p2 === ethers.constants.AddressZero &&
      gameState.p1.toLowerCase() !== account.toLowerCase();

    return (
      <div className="px-5 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl m-0 mb-8 text-gray-800">🎮 Game #{gameId}</h2>

          <div className="mb-8 p-5 bg-gray-50 rounded-2xl">
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Player 1:</span>
                <span className="font-mono text-gray-800">
                  {gameState.p1.slice(0, 6)}...{gameState.p1.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Player 2:</span>
                <span className="font-mono text-gray-800">
                  {gameState.p2 === ethers.constants.AddressZero
                    ? "Waiting..."
                    : `${gameState.p2.slice(0, 6)}...${gameState.p2.slice(-4)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Stake:</span>
                <span className="font-semibold text-gray-800">
                  {gameState.stake} ETH
                </span>
              </div>
            </div>
          </div>

          {canJoin && (
            <>
              <div className="mb-8">
                <h3 className="text-xl mb-5 text-gray-600">
                  Choose Your Move:
                </h3>
                <div className="flex justify-center gap-5 flex-wrap">
                  {[Move.Rock, Move.Paper, Move.Scissors].map((move) => (
                    <button
                      key={move}
                      className={`bg-white border-3 rounded-2xl p-5 cursor-pointer transition-all duration-300 min-w-32 flex flex-col items-center gap-2.5 hover:border-primary hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 ${
                        selectedMove === move
                          ? "border-primary bg-gradient-to-br from-primary to-primary-dark text-white transform -translate-y-0.5 shadow-lg shadow-primary/30"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedMove(move)}
                    >
                      <span className="text-4xl">{getMoveIcon(move)}</span>
                      <span className="font-semibold text-lg">
                        {getMoveName(move)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="px-8 py-4 border-none rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 min-w-52 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                onClick={joinGame}
                disabled={loading || selectedMove === Move.None}
              >
                {loading ? "Joining..." : `Join Game (${gameState.stake} ETH)`}
              </button>
            </>
          )}

          {!canJoin && (
            <div className="py-10 px-5 text-gray-600">
              <div className="text-5xl mb-4 animate-pulse-custom">⏳</div>
              <p>Waiting for another player to join...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "reveal" && gameState) {
    return (
      <div className="px-5 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl m-0 mb-8 text-gray-800">
            🎮 Game #{gameId} - Reveal Phase
          </h2>

          <div className="mb-8">
            <div className="flex justify-around items-center my-8 flex-wrap gap-5">
              <div className="text-center flex-1 min-w-40">
                <h4 className="m-0 mb-4 text-gray-600 text-lg">Player 1</h4>
                <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center gap-2.5 min-h-24 justify-center">
                  {gameState.p1Move !== Move.None ? (
                    <>
                      <span className="text-3xl">
                        {getMoveIcon(gameState.p1Move)}
                      </span>
                      <span>{getMoveName(gameState.p1Move)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">❓ Hidden</span>
                  )}
                </div>
              </div>

              <div className="text-2xl font-bold text-primary mx-5">VS</div>

              <div className="text-center flex-1 min-w-40">
                <h4 className="m-0 mb-4 text-gray-600 text-lg">Player 2</h4>
                <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center gap-2.5 min-h-24 justify-center">
                  {gameState.p2Move !== Move.None ? (
                    <>
                      <span className="text-3xl">
                        {getMoveIcon(gameState.p2Move)}
                      </span>
                      <span>{getMoveName(gameState.p2Move)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">❓ Hidden</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isMyTurn() && (
            <div className="mt-8 p-5 bg-gray-50 rounded-2xl">
              <h3 className="m-0 mb-5 text-gray-600">Reveal Your Move</h3>
              <div className="flex gap-5 justify-center mb-5 flex-wrap">
                <div className="flex flex-col gap-1 min-w-52">
                  <label className="font-semibold text-gray-600 text-left">
                    Your Move:
                  </label>
                  <select
                    value={revealMoveState}
                    onChange={(e) =>
                      setRevealMoveState(Number(e.target.value) as Move)
                    }
                    className="px-2.5 py-2.5 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary"
                  >
                    <option value={Move.None}>Select Move</option>
                    <option value={Move.Rock}>🪨 Rock</option>
                    <option value={Move.Paper}>📄 Paper</option>
                    <option value={Move.Scissors}>✂️ Scissors</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 min-w-52">
                  <label className="font-semibold text-gray-600 text-left">
                    Salt (from creation):
                  </label>
                  <input
                    type="text"
                    value={revealSalt}
                    onChange={(e) => setRevealSalt(e.target.value)}
                    placeholder="Enter your salt..."
                    className="px-2.5 py-2.5 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                className="px-8 py-4 border-none rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 min-w-52 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                onClick={submitReveal}
                disabled={
                  loading || revealMoveState === Move.None || !revealSalt
                }
              >
                {loading ? "Revealing..." : "Reveal Move"}
              </button>
            </div>
          )}

          {!isMyTurn() && (
            <div className="py-10 px-5 text-gray-600">
              <div className="text-5xl mb-4 animate-pulse-custom">⏳</div>
              <p>Waiting for players to reveal their moves...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "finished" && gameState) {
    const winner = getWinner();

    return (
      <div className="px-5 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl m-0 mb-8 text-gray-800">
            🎮 Game #{gameId} - Finished
          </h2>

          <div className="text-center">
            <div className="flex justify-around items-center my-8 flex-wrap gap-5">
              <div className="text-center flex-1 min-w-40">
                <h4 className="m-0 mb-4 text-gray-600 text-lg">Player 1</h4>
                <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center gap-2.5 min-h-24 justify-center">
                  <span className="text-3xl">
                    {getMoveIcon(gameState.p1Move)}
                  </span>
                  <span>{getMoveName(gameState.p1Move)}</span>
                </div>
              </div>

              <div className="text-2xl font-bold text-primary mx-5">VS</div>

              <div className="text-center flex-1 min-w-40">
                <h4 className="m-0 mb-4 text-gray-600 text-lg">Player 2</h4>
                <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center gap-2.5 min-h-24 justify-center">
                  <span className="text-3xl">
                    {getMoveIcon(gameState.p2Move)}
                  </span>
                  <span>{getMoveName(gameState.p2Move)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-8 rounded-2xl">
              {winner === "tie" && (
                <div className="flex flex-col items-center gap-2.5 bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800 p-8 rounded-2xl">
                  <span className="text-5xl">🤝</span>
                  <h3 className="m-0 text-3xl">It's a Tie!</h3>
                  <p className="m-0 text-lg opacity-80">
                    Stakes have been refunded
                  </p>
                </div>
              )}
              {winner === "p1" && (
                <div className="flex flex-col items-center gap-2.5 bg-gradient-to-br from-green-100 to-emerald-200 text-green-800 p-8 rounded-2xl">
                  <span className="text-5xl">🏆</span>
                  <h3 className="m-0 text-3xl">Player 1 Wins!</h3>
                  <p className="m-0 text-lg opacity-80">Winner takes the pot</p>
                </div>
              )}
              {winner === "p2" && (
                <div className="flex flex-col items-center gap-2.5 bg-gradient-to-br from-green-100 to-emerald-200 text-green-800 p-8 rounded-2xl">
                  <span className="text-5xl">🏆</span>
                  <h3 className="m-0 text-3xl">Player 2 Wins!</h3>
                  <p className="m-0 text-lg opacity-80">Winner takes the pot</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-5"></div>
            <p>Loading game...</p>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gameId={createdGameId}
        gameUrl={`${window.location.origin}/game/${createdGameId}`}
      />
    </>
  );
};

export default GameBoard;
