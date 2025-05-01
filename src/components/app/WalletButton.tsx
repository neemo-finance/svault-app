"use client";
import { useAppKit, useAppKitAccount, useAppKitNetwork, useWalletInfo } from "@reown/appkit/react";
import Button from "../atom/Button";
import { truncateAddress } from "@/utils/common";
import { useAtomValue } from "jotai";
import { appDataAtom } from "../provider/AppStateProvider";
import { VAULT_CONFIG } from "@/constants/web3config";

export default function WalletButton() {
    const appData = useAtomValue(appDataAtom);
    const { isConnected, address } = useAppKitAccount();
    const { chainId, switchNetwork } = useAppKitNetwork();
    const { walletInfo } = useWalletInfo();
    
    const { open } = useAppKit();

    const expectedNetwork = VAULT_CONFIG[appData.vault].mainnet;
    const isCorrectNetwork = chainId === expectedNetwork.id;

    if (!isConnected) return (
        <Button variant="wallet" size="wallet" onClick={() => open()}>
            Connect Wallet
        </Button>
    );

    if (!isCorrectNetwork) return (
        <Button variant="wallet" size="wallet" onClick={() => switchNetwork(expectedNetwork)}>
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