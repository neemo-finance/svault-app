import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { appDataAtom, appEventsAtom } from "@/components/provider/AppStateProvider";
import { getAgentLogs } from "@/utils/apiUtils";
import useContractRead from "./contract/contractRead";
import { VAULT_CONFIG } from "@/constants/web3config";
import { Network, Token } from "@/constants/types";
import { useAppKitAccount } from "@reown/appkit/react";

export default function useAppData() {
    const { address } = useAppKitAccount();
    const [appData, setAppData] = useAtom(appDataAtom);
    const events = useAtomValue(appEventsAtom);

    const vault = VAULT_CONFIG[appData.vault];
    const network = vault.mainnet._id;

    const {
        getCurrentPosition,
        getUserDepositValue,
        getTokenAllowance,
        getTokenBalance,
    } = useContractRead();

    async function getDepositTokenData (token: Token) {
        const [balance, allowance] = await Promise.all([
            getTokenBalance(token),
            getTokenAllowance(token)
        ]);
        return {[token]: {
            balance,
            allowance
        }}
    }

    useEffect(() => {
        async function fetchData() {
            const [agentLogs, currentPosition, userDeposit, depositTokens] = await Promise.all([
                getAgentLogs(),
                getCurrentPosition(),
                getUserDepositValue(),
                Promise.all(vault.depositTokens[network]!.map((token) => getDepositTokenData(token)))
            ]);

            console.log({
                agentLogs
            })

            setAppData((prev) => ({
                ...prev,
                agentLogs,
                currentPosition,
                userDeposit,
                depositTokens: depositTokens.reduce((acc, tokenData) => {
                    return { ...acc, ...tokenData };
                }, {})
            }));
        }

        fetchData();
    }, [address, events.updateAppDataEvent, events.tokenApprovalEvent, events.depositEvent, events.withdrawEvent])

}