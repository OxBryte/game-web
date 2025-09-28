import React from "react";
import { useConnect } from "wagmi";

interface ConnectWalletProps {
  onConnect: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = () => {
  const { connect, connectors, isPending } = useConnect();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-5">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 text-center shadow-2xl max-w-md w-full">
        <div className="mb-8">
          <div className="flex justify-center gap-2.5 mb-5">
            <span className="text-4xl animate-bounce-custom">🪨</span>
            <span className="text-4xl animate-bounce-custom [animation-delay:0.3s]">
              📄
            </span>
            <span className="text-4xl animate-bounce-custom [animation-delay:0.6s]">
              ✂️
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent m-0 mb-2.5">
            Rock Paper Scissors
          </h1>
          <p className="text-gray-600 text-lg m-0">
            On-Chain Gaming Experience
          </p>
        </div>

        <div className="flex justify-around my-8 gap-5">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">⚡</span>
            <span className="text-sm text-gray-600 font-medium">
              Fast & Fair
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🔒</span>
            <span className="text-sm text-gray-600 font-medium">
              Secure Commits
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">💰</span>
            <span className="text-sm text-gray-600 font-medium">
              Micro Stakes
            </span>
          </div>
        </div>

        {/* Wallet Connect Buttons */}
        <div className="space-y-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 hover:transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">
                {connector.name === "Injected" ? "🦊" : "🔗"}
              </span>
              {isPending ? "Connecting..." : `Connect ${connector.name}`}
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-sm m-0 leading-relaxed">
          Connect your wallet to start playing Rock Paper Scissors on-chain
        </p>
      </div>
    </div>
  );
};

export default ConnectWallet;
