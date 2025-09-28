import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { mainnet, arbitrum, base, polygon } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://dashboard.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "YOUR_PROJECT_ID";

// 2. Create wagmi config
const config = createConfig({
  chains: [mainnet, arbitrum, base, polygon],
  connectors: [
    injected(),
    walletConnect({
      projectId,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
  },
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export { config as wagmiAdapter };
