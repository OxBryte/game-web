import { createAppKit } from "@reown/appkit/react";

import { WagmiProvider } from "wagmi";
import {
  arbitrum,
  mainnet,
  optimism,
  polygon,
  base,
  celo,
  type AppKitNetwork,
  baseSepolia,
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
const networks = [baseSepolia, mainnet, arbitrum, optimism, polygon, base, celo] as AppKitNetwork[];
// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: networks as [AppKitNetwork, ...AppKitNetwork[]] as AppKitNetwork[],
  projectId,
  ssr: true,
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as [AppKitNetwork, ...AppKitNetwork[]],
  defaultNetwork: baseSepolia,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
