import { appDataAtom } from "@/components/provider/AppStateProvider";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAtomValue } from "jotai";
import { TOKEN_CONFIG, VAULT_CONFIG } from "@/constants/web3config";
import { getContract, getDepositTokenContract } from "@/utils/contractUtils";
import { Eip1193Provider, MaxUint256 } from "ethers";
import { Token } from "@/constants/types";
import { handleError } from "@/utils/error";

export default function useContractWrite() {
    const appData = useAtomValue(appDataAtom);

    const walletProvider = useAppKitProvider("eip155").walletProvider as
        | Eip1193Provider
        | undefined;

    const Vault = VAULT_CONFIG[appData.vault];
    const Network = Vault.mainnet._id;
    const tokenConfig = TOKEN_CONFIG[Network];

    const NeemoYieldAgent = getContract(
        appData.vault,
        Network,
        "NeemoYieldAgent",
        walletProvider
    );

    async function deposit({
        token,
        amount,
    }: {
        token: Token;
        amount: bigint;
    }) {
        const contract = await NeemoYieldAgent;
        if (!contract) return;

        const txn = await contract.deposit(tokenConfig[token].address, amount).catch(handleError());
        return txn;
    }

    async function withdraw({ amount }: { amount: bigint }) {
        const contract = await NeemoYieldAgent;
        if (!contract) return;

        const txn = await contract.withdraw(amount).catch(handleError());
        return txn;
    }

    async function approveTokenSpend({ token }: { token: Token }) {
        const contract = await getDepositTokenContract(
            token,
            Network,
            walletProvider
        );
        if (!contract) return;

        const vaultAddress = Vault.contract[Network]?.NeemoYieldAgent;
        const txn = await contract.approve(vaultAddress, MaxUint256).catch(handleError());
        return txn;
    }

    return {
        deposit,
        withdraw,
        approveTokenSpend,
    };
}
