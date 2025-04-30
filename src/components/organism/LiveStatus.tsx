"use client";
import { useAtomValue } from "jotai";
import { AgentLog } from "@/constants/types";
import { appDataAtom } from "../provider/AppStateProvider";

export default function LiveStatus() {
    const appData = useAtomValue(appDataAtom);

    return (
        <div className="p-6 rounded-2xl bg-card-background border border-white/10 md:max-w-80 md:h-[85vh] h-[50vh] md:min-w-80 relative overflow-hidden">
            <h2 className="text-lg mb-4">Live Status</h2>
            {appData.agentLogs.length ?
                <div className="flex flex-col gap-4 overflow-auto max-h-full hide-scrollbar">
                    {appData.agentLogs.map((log, index) => (
                        <StatusCard log={log} key={index} />
                    ))}
                </div> :
                <div className="h-full w-full grid place-content-center font-mono tracking-tight">
                    <span className="text-sm text-zinc-400">No Logs</span>
                </div>
            }
        </div>
    );
}

function StatusCard({ log }: { log: AgentLog }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span>Vault Agent</span>
                <span className="text-xs text-primary px-2 py-1 rounded-sm bg-primary/5 uppercase font-mono">
                    {log.tag}
                </span>
            </div>
            <p className="text-sm tracking-tight text-zinc-400 font-mono">
                {log.readable_log_entry}
            </p>
            <p className="text-xs text-white/55 text-right -mt-2">{formatTimestamp(log.timestamp)}</p>
        </div>
    );
}

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month} - ${hours}:${minutes}`;
};
