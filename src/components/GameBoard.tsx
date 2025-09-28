import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./GameBoard.css";

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
    "create" | "commit" | "reveal" | "finished"
  >("create");
  const [, setMyCommit] = useState("");
  const [revealMoveState, setRevealMoveState] = useState<Move>(Move.None);
  const [revealSalt, setRevealSalt] = useState("");

  useEffect(() => {
    if (mode === "create") {
      setPhase("create");
    } else if (gameId !== null && contract) {
      loadGameState();
    }
  }, [gameId, contract, mode]);

  useEffect(() => {
    // Generate random salt when component mounts
    setSalt(ethers.utils.hexlify(ethers.utils.randomBytes(32)));
  }, []);

  const loadGameState = async () => {
    if (!contract || gameId === null) return;

    try {
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
        setPhase("commit");
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
    }
  };

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
        (e: any) => e.event === "GameCreated"
      );

      if (gameCreatedEvent) {
        const newGameId = gameCreatedEvent.args.gameId.toNumber();
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
      await loadGameState();
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
      await loadGameState();
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

  if (phase === "create") {
    return (
      <div className="game-board">
        <div className="game-card">
          <h2>🎮 Create New Game</h2>

          <div className="stake-input">
            <label>Stake Amount (ETH):</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="0.001"
            />
          </div>

          <div className="move-selection">
            <h3>Choose Your Move:</h3>
            <div className="moves">
              {[Move.Rock, Move.Paper, Move.Scissors].map((move) => (
                <button
                  key={move}
                  className={`move-button ${
                    selectedMove === move ? "selected" : ""
                  }`}
                  onClick={() => setSelectedMove(move)}
                >
                  <span className="move-icon">{getMoveIcon(move)}</span>
                  <span className="move-name">{getMoveName(move)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="action-button create"
            onClick={createGame}
            disabled={loading || selectedMove === Move.None}
          >
            {loading ? "Creating..." : `Create Game (${stake} ETH)`}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "commit" && gameState) {
    const canJoin =
      gameState.p2 === ethers.constants.AddressZero &&
      gameState.p1.toLowerCase() !== account.toLowerCase();

    return (
      <div className="game-board">
        <div className="game-card">
          <h2>🎮 Game #{gameId}</h2>

          <div className="game-info">
            <div className="players-info">
              <div className="player-info">
                <span className="label">Player 1:</span>
                <span className="address">
                  {gameState.p1.slice(0, 6)}...{gameState.p1.slice(-4)}
                </span>
              </div>
              <div className="player-info">
                <span className="label">Player 2:</span>
                <span className="address">
                  {gameState.p2 === ethers.constants.AddressZero
                    ? "Waiting..."
                    : `${gameState.p2.slice(0, 6)}...${gameState.p2.slice(-4)}`}
                </span>
              </div>
              <div className="player-info">
                <span className="label">Stake:</span>
                <span className="value">{gameState.stake} ETH</span>
              </div>
            </div>
          </div>

          {canJoin && (
            <>
              <div className="move-selection">
                <h3>Choose Your Move:</h3>
                <div className="moves">
                  {[Move.Rock, Move.Paper, Move.Scissors].map((move) => (
                    <button
                      key={move}
                      className={`move-button ${
                        selectedMove === move ? "selected" : ""
                      }`}
                      onClick={() => setSelectedMove(move)}
                    >
                      <span className="move-icon">{getMoveIcon(move)}</span>
                      <span className="move-name">{getMoveName(move)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="action-button join"
                onClick={joinGame}
                disabled={loading || selectedMove === Move.None}
              >
                {loading ? "Joining..." : `Join Game (${gameState.stake} ETH)`}
              </button>
            </>
          )}

          {!canJoin && (
            <div className="waiting-message">
              <div className="waiting-icon">⏳</div>
              <p>Waiting for another player to join...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "reveal" && gameState) {
    return (
      <div className="game-board">
        <div className="game-card">
          <h2>🎮 Game #{gameId} - Reveal Phase</h2>

          <div className="reveal-info">
            <div className="moves-display">
              <div className="player-move">
                <h4>Player 1</h4>
                <div className="move-display">
                  {gameState.p1Move !== Move.None ? (
                    <>
                      <span className="move-icon">
                        {getMoveIcon(gameState.p1Move)}
                      </span>
                      <span>{getMoveName(gameState.p1Move)}</span>
                    </>
                  ) : (
                    <span className="hidden">❓ Hidden</span>
                  )}
                </div>
              </div>

              <div className="vs">VS</div>

              <div className="player-move">
                <h4>Player 2</h4>
                <div className="move-display">
                  {gameState.p2Move !== Move.None ? (
                    <>
                      <span className="move-icon">
                        {getMoveIcon(gameState.p2Move)}
                      </span>
                      <span>{getMoveName(gameState.p2Move)}</span>
                    </>
                  ) : (
                    <span className="hidden">❓ Hidden</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isMyTurn() && (
            <div className="reveal-section">
              <h3>Reveal Your Move</h3>
              <div className="reveal-inputs">
                <div className="input-group">
                  <label>Your Move:</label>
                  <select
                    value={revealMoveState}
                    onChange={(e) =>
                      setRevealMoveState(Number(e.target.value) as Move)
                    }
                  >
                    <option value={Move.None}>Select Move</option>
                    <option value={Move.Rock}>🪨 Rock</option>
                    <option value={Move.Paper}>📄 Paper</option>
                    <option value={Move.Scissors}>✂️ Scissors</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Salt (from creation):</label>
                  <input
                    type="text"
                    value={revealSalt}
                    onChange={(e) => setRevealSalt(e.target.value)}
                    placeholder="Enter your salt..."
                  />
                </div>
              </div>

              <button
                className="action-button reveal"
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
            <div className="waiting-message">
              <div className="waiting-icon">⏳</div>
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
      <div className="game-board">
        <div className="game-card">
          <h2>🎮 Game #{gameId} - Finished</h2>

          <div className="final-result">
            <div className="moves-display">
              <div className="player-move">
                <h4>Player 1</h4>
                <div className="move-display">
                  <span className="move-icon">
                    {getMoveIcon(gameState.p1Move)}
                  </span>
                  <span>{getMoveName(gameState.p1Move)}</span>
                </div>
              </div>

              <div className="vs">VS</div>

              <div className="player-move">
                <h4>Player 2</h4>
                <div className="move-display">
                  <span className="move-icon">
                    {getMoveIcon(gameState.p2Move)}
                  </span>
                  <span>{getMoveName(gameState.p2Move)}</span>
                </div>
              </div>
            </div>

            <div className="winner-announcement">
              {winner === "tie" && (
                <div className="result tie">
                  <span className="result-icon">🤝</span>
                  <h3>It's a Tie!</h3>
                  <p>Stakes have been refunded</p>
                </div>
              )}
              {winner === "p1" && (
                <div className="result win">
                  <span className="result-icon">🏆</span>
                  <h3>Player 1 Wins!</h3>
                  <p>Winner takes the pot</p>
                </div>
              )}
              {winner === "p2" && (
                <div className="result win">
                  <span className="result-icon">🏆</span>
                  <h3>Player 2 Wins!</h3>
                  <p>Winner takes the pot</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="game-card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
