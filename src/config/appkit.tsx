import { createAppKit } from "@reown/appkit/react";

import { WagmiProvider } from "wagmi";
import {
  arbitrum,
  mainnet,
  optimism,
  polygon,
  base,
  celo,
} from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://dashboard.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

// 2. Create a metadata object - optional
const metadata = {
  name: "Base Watch",
  description: "Base Watch",
  url: "https://base-watch.vercel.app", // origin must match your domain & subdomain
  icons: ["https://base-watch.vercel.app/favicon.ico"],
};

// 3. Set the networks
const networks = [mainnet, arbitrum, optimism, polygon, base, celo];
// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: optimism,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
