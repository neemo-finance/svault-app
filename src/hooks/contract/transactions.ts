import { appEventsAtom, appTransactionsAtom, Events } from '@/components/provider/AppStateProvider';
// import { ToastIcon, useAlerts } from '@/hooks/app/alerts';
import { useEvents } from '@/hooks/app/events';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { Eip1193Provider } from 'ethers';
import { BrowserProvider } from 'ethers';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use';

export interface Transaction {
    uniqueId?: string;
    hash: string;
    chainId: number | string;
    address: string;
    successMsg?: string;
    failedMsg?: string;
    onSuccess?: () => void;
    event: Events;
}

export function getPendingTransactions(
    address: string | null | undefined,
    chainId: string | number | undefined,
    transactions: Transaction[],
) {
    if (!address || !chainId) return [];
    return transactions.filter(
        (l) => l.address.toLocaleLowerCase() === address?.toLocaleLowerCase() && l.chainId === chainId,
    );
}

export const useTransactionsManager = () => {
    const { address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();
    const walletProvider = useAppKitProvider("eip155").walletProvider as Eip1193Provider | undefined;
    const provider = walletProvider ? new BrowserProvider(walletProvider) : null;
    const { pushEvent } = useEvents();
    // const { alertError, alertSuccess } = useAlerts();
    const appEvents = useAtomValue(appEventsAtom);
    const [transactions, setTransactions] = useAtom(appTransactionsAtom);
    const [value, setValue] = useLocalStorage('svault-transactions', undefined, {
        raw: false,
        serializer: (value: any) => JSON.stringify(value),
        deserializer: (value: any) => JSON.parse(value),
    });
    const [polling, setPolling] = useState<NodeJS.Timeout | null>();

    // Initial load from disk
    useEffect(() => {
        if (value && value.length > 0) setTransactions(value);
    }, []);

    // Set-up polling for transactions
    useEffect(() => {
        if (transactions.length > 0 && !polling) {
            const id = setInterval(function () {
                pushEvent(Events.transactionEvent, Date.now());
            }, 3000);
            setPolling(id);
        } else if (transactions.length == 0 && polling) {
            clearInterval(polling);
            setPolling(null);
        }
    }, [transactions]);

    // Checks transactions
    useEffect(() => {
        if (transactions.length > 0) checkTransactions().then();
    }, [appEvents.transactionEvent]);

    const getTransaction = async (hash: string) => {
        // Retry 5 times if receipt is invalid, this might delay the error toast for legit invalid transactions
        let transaction = await provider?.getTransaction(hash);
        let retries = 0;
        while ((!transaction || !transaction.blockNumber) && retries < 5) {
            await new Promise((r) => setTimeout(r, 3000));
            transaction = await provider?.getTransaction(hash);
            retries++;
        }
        return transaction;
    };

    const getNewPendingHashes = async (pending: Transaction[]) => {
        const newPendingHashes: string[] = [];
        for (const tx of pending) {
            const isRightEthereumNetworkAndWallet =
                tx.chainId === chainId && tx.address.toLocaleLowerCase() === address?.toLocaleLowerCase();

            if (isRightEthereumNetworkAndWallet) {
                // Use getTransaction with retry in intervals since this can sometimes fail on OKX provider
                let receipt = await getTransaction(tx.hash);
                const confirmations = (await receipt?.confirmations()) ?? 0;
                if (!receipt || confirmations > 0) {
                    if (receipt && confirmations > 0) {
                        const r = await provider?.getTransactionReceipt(tx.hash);
                        if (r?.status == 0) {
                            const msg = tx.failedMsg ?? 'Transaction failed';
                            // alertError(msg, tx.hash);
                        } else if (r?.status == 1) {
                            const msg = tx.successMsg ?? 'Transaction successful';
                            // alertSuccess(msg, tx.hash);
                            pushEvent(tx.event);
                            tx.onSuccess?.();
                        }
                    } else {
                        const msg = tx.failedMsg ?? 'Transaction failed';
                        // alertError(msg, tx.hash);
                    }
                    continue;
                }
            }
            newPendingHashes.push(tx.hash);
        }
        return newPendingHashes;
    };

    const checkTransactions = async () => {
        if (walletProvider) {
            const hashes = await getNewPendingHashes(transactions);
            const newPending = transactions.filter((x) => hashes.includes(x.hash));
            setTransactions(newPending);
            setValue(newPending);
        }
    };

    return {};
};

export const useTransactions = () => {
    const walletProvider = useAppKitProvider("eip155").walletProvider as Eip1193Provider | undefined;
    const provider = walletProvider ? new BrowserProvider(walletProvider) : null;
    const { pushEvent } = useEvents();
    const [transactions, setTransactions] = useAtom(appTransactionsAtom);
    const [value, setValue] = useLocalStorage('svault-transactions', undefined, {
        raw: false,
        serializer: (value: any) => JSON.stringify(value),
        deserializer: (value: any) => JSON.parse(value),
    });

    // const { alertCustom } = useAlerts();

    const waitTx = async (hash: string) => {
        // alertCustom("Processing Transaction", ToastIcon.Loading, undefined, hash);
        await provider?.waitForTransaction(hash);
        pushEvent(Events.transactionEvent);
    };

    const pushTx = (transaction: Transaction) => {
        if (transaction.hash) {
            const newList = [...transactions, transaction];
            setTransactions(newList);
            setValue(newList);
            waitTx(transaction.hash).then();
        }
    };

    return { pushTx };
};
