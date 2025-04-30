import { JsonRpcProvider } from "ethers";
import { getAgentLogs } from "./apiUtils";
import { AgentLog } from "@/constants/types";
import { NETWORK_CONFIG } from "@/constants/web3config";
import { getReadContract } from "./contractUtils";

export default async function getServerAppData(): Promise<ServerAppData> {
    const provider = new JsonRpcProvider(NETWORK_CONFIG.soneium.rpcUrls.default.http[0]);
    const NeemoYieldAgentContract = await getReadContract('USDC', 'soneium', 'NeemoYieldAgent', provider);
    
    const [agentLogs, currentPosition] = await Promise.all([
        getAgentLogs(),
        NeemoYieldAgentContract?.getCurrentPosition()
    ]);
    
    return {    
        agentLogs,
        currentPosition: {
            currentProtocolId: currentPosition[0],
            totalAssets: currentPosition[1],
            currentProtocolAPY: currentPosition[2],
        }
    };
}

export type ServerAppData = {
    agentLogs: AgentLog[];
    currentPosition: {
        currentProtocolId: bigint,
        totalAssets: bigint,
        currentProtocolAPY: bigint,
    }
}