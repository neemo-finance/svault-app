"use client";
import { AgentLog, Vault, Token } from "@/constants/types";
import { usePolling } from "@/hooks/app/polling";
import useAppData from "@/hooks/appData";
import { Transaction, useTransactionsManager } from "@/hooks/contract/transactions";
import { ServerAppData } from "@/utils/ssr";
import { atom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

export interface AppData {
    vault: Vault;
    agentLogs: AgentLog[];
    currentPosition: {
        currentProtocolId: bigint;
        totalAssets: bigint;
        currentProtocolAPY: bigint;
    },
    userDeposit: bigint;
    depositTokens: {
        [T in Token]?: {
            balance: bigint;
            allowance: bigint;
        }
    }
}

const INITIAL_APP_DATA: AppData = {
    vault: 'USDC',
    agentLogs: [],
    currentPosition: {
        currentProtocolId: 0n,
        totalAssets: 0n,
        currentProtocolAPY: 0n,
    },
    userDeposit: 0n,
    depositTokens: {}
}

export const appDataAtom = atom<AppData>(INITIAL_APP_DATA);

export const appTransactionsAtom = atom<Transaction[]>([]);

export enum Events {
    updateAppDataEvent = "updateAppDataEvent",
    transactionEvent = "transactionEvent",
    tokenApprovalEvent = "tokenApprovalEvent",
    depositEvent = "depositEvent",
    withdrawEvent = "withdrawEvent"
}

export const appEventsAtom = atom<Record<Events, number>>({
    updateAppDataEvent: 0,
    transactionEvent: 0,
    tokenApprovalEvent: 0,
    depositEvent: 0,
    withdrawEvent: 0
});

export default function AppStateProvider({
    serverData,
    children,
}: {
    serverData: ServerAppData;
    children: React.ReactNode;
}) {
    usePolling();
    useAppData();
    useTransactionsManager();

    useHydrateAtoms([[appDataAtom, {
        ...INITIAL_APP_DATA,
        ...serverData
    }]])

    return children;
}
