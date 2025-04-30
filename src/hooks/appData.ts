import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { appDataAtom, appEventsAtom } from "@/components/provider/AppStateProvider";
import { getAgentLogs } from "@/utils/apiUtils";
import useContractRead from "./contract/contractRead";

export default function useAppData() {
    const setAppData = useSetAtom(appDataAtom);
    const events = useAtomValue(appEventsAtom);

    const {
        getCurrentPosition,
        getUserDepositValue
    } = useContractRead();

    useEffect(() => {
        async function fetchData() {
            const [agentLogs, currentPosition, userDeposit] = await Promise.all([
                getAgentLogs(),
                getCurrentPosition(),
                getUserDepositValue()
            ]);

            setAppData((prev) => ({
                ...prev,
                agentLogs: agentLogs.length ? agentLogs : prev.agentLogs,
                currentPosition,
                userDeposit
            }));
        }

        fetchData();
    }, [events.updateAppDataEvent])

}