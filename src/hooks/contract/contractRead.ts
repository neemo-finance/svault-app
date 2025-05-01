import { appDataAtom } from "@/components/provider/AppStateProvider";
import { Token } from "@/constants/types";
import { VAULT_CONFIG } from "@/constants/web3config";
import { getReadContract, getTokenReadContract } from "@/utils/contractUtils";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { JsonRpcProvider } from "ethers";
import { Eip1193Provider } from "ethers";
import { useAtomValue } from "jotai";

export default function useContractRead() {
    const appData = useAtomValue(appDataAtom);

    const { address } = useAppKitAccount();
    const walletProvider = useAppKitProvider('eip155').walletProvider as Eip1193Provider | undefined;

    const Network = VAULT_CONFIG[appData.vault].mainnet;
    const ethersProvider = walletProvider ? new BrowserProvider(walletProvider) : new JsonRpcProvider(Network.rpcUrls.default.http[0]);

    const NeemoYieldAgent = getReadContract(appData.vault, Network._id, 'NeemoYieldAgent', ethersProvider);

    async function getCurrentPosition(): Promise<{
        currentProtocolId: bigint;
        totalAssets: bigint;
        currentProtocolAPY: bigint;
    }> {
        const zero = {
            currentProtocolId: 0n,
            totalAssets: 0n,
            currentProtocolAPY: 0n,
        };
        if (!ethersProvider) return zero;
        try {
            const contract = await NeemoYieldAgent;
            if (!contract) return zero;

            const res = await contract.getCurrentPosition();
            return {
                currentProtocolId: res[0],
                totalAssets: res[1],
                currentProtocolAPY: res[2],
            };
        } catch (error) {
            console.log('error getCurrentPosition', error);
            return zero;
        }
    }

    async function getUserDepositValue(): Promise<{
        current: bigint;
        deposit: bigint;
    }> {
        if (!ethersProvider || !address) return {
            current: 0n,
            deposit: 0n
        };
        try {
            const contract = await NeemoYieldAgent;
            if (!contract) return {
                current: 0n,
                deposit: 0n
            };

            const res = await contract.getUserDepositValue(address);
            return {
                current: res[0],
                deposit: res[1]
            };
        } catch (error) {
            console.log('error getUserDepositValue', error);
            return {
                current: 0n,
                deposit: 0n
            };
        }
    }

    async function getTokenBalance(token: Token): Promise<bigint> {
        if (!ethersProvider || !address) return 0n;
        try {
            const contract = await getTokenReadContract(token, Network._id, ethersProvider);
            if (!contract) return 0n;

            const res = await contract.balanceOf(address);
            return res;
        } catch (error) {
            console.log(`error getTokenBalance(${token})`, error);
            return 0n;
        }
    }
    
    async function getTokenAllowance(token: Token): Promise<bigint> {
        if (!ethersProvider || !address) return 0n;
        try {
            const contract = await getTokenReadContract(token, Network._id, ethersProvider);
            if (!contract) return 0n;
            
            const vaultAddress = VAULT_CONFIG[appData.vault].contract[Network._id]?.NeemoYieldAgent;
            const res = await contract.allowance(address, vaultAddress);
            return res;
        } catch (error) {
            console.log(`error getTokenAllowance(${token})`, error);
            return 0n;
        }
    }
    

    return {
        getCurrentPosition,
        getUserDepositValue,
        getTokenBalance,
        getTokenAllowance,
    }
}