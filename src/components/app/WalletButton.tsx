"use client";
import { useAppKit, useAppKitAccount, useAppKitNetwork, useWalletInfo } from "@reown/appkit/react";
import Button from "../atom/Button";
import { truncateAddress } from "@/utils/common";

export default function WalletButton() {
    const { isConnected, address, status } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();
    const { walletInfo } = useWalletInfo();
    
    const { open } = useAppKit();

    // TODO: Replace with actual network check
    const isCorrectNetwork = true;

    if (status === "connecting" || status === "reconnecting") return (
        <Button 
            variant="wallet" 
            size="wallet" 
            isLoading 
            disabled
        >
            Connecting
        </Button>
    )

    if (!isConnected) return (
        <Button variant="wallet" size="wallet" onClick={() => open()}>
            Connect Wallet
        </Button>
    );

    if (!isCorrectNetwork) return (
        <Button variant="wallet" size="wallet" onClick={() => open()}>
            Switch Network
        </Button>
    )

    if (isConnected && isCorrectNetwork) return (
        <Button variant="wallet" size="wallet" onClick={() => open()}>
            {truncateAddress(address)}
            {walletInfo?.icon &&
                <img src={walletInfo.icon} alt="Wallet Icon" className="w-6 h-6" />
            }
        </Button>
    )
}