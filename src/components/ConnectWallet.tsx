import React from "react";
import "./ConnectWallet.css";

interface ConnectWalletProps {
  onConnect: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ onConnect }) => {
  return (
    <div className="connect-wallet">
      <div className="connect-wallet-card">
        <div className="game-logo">
          <div className="logo-icons">
            <span className="icon">🪨</span>
            <span className="icon">📄</span>
            <span className="icon">✂️</span>
          </div>
          <h1>Rock Paper Scissors</h1>
          <p className="subtitle">On-Chain Gaming Experience</p>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Fast & Fair</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Secure Commits</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💰</span>
            <span>Micro Stakes</span>
          </div>
        </div>

        <button className="connect-button" onClick={onConnect}>
          <span className="wallet-icon">🦊</span>
          Connect MetaMask
        </button>

        <p className="disclaimer">
          Connect your wallet to start playing Rock Paper Scissors on-chain
        </p>
      </div>
    </div>
  );
};

export default ConnectWallet;
