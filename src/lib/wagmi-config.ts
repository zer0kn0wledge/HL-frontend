import { cookieStorage, createStorage, http } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get your projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "demo-project-id";

if (!projectId || projectId === "demo-project-id") {
  console.warn("Reown Project ID not configured. Get one at https://cloud.reown.com");
}

export const networks = [arbitrum];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [arbitrum.id]: http(),
  },
});

export const config = wagmiAdapter.wagmiConfig;
