"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { NETWORK_CONFIG } from "@/constants/web3config";

// 1. Get projectId at https://cloud.reown.com
const projectId = "c8ebcb5f6a8d7bb8548f4220551e7864";

// 2. Create a metadata object
const metadata = {
    name: "Neemo Vault",
    description: "My Website description",
    url: "https://mywebsite.com", // origin must match your domain & subdomain
    icons: ["https://avatars.mywebsite.com/"],
};

// 3. Create the AppKit instance
createAppKit({
    adapters: [new EthersAdapter()],
    metadata,
    networks: [NETWORK_CONFIG.soneium],
    projectId,
    themeMode: "dark",
    themeVariables: {},
    features: {
        analytics: false,
        swaps: false,
        onramp: false,
        email: false,
        socials: false,
    },
});

export default function WalletProvider({ children }: { children: React.ReactNode }) {
    return children;
}
