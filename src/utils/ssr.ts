import { JsonRpcProvider } from "ethers";
import { AgentLog } from "@/constants/types";
import { NETWORK_CONFIG } from "@/constants/web3config";
import { getReadContract } from "./contractUtils";
import axios from "axios";

const API_URL = process.env.API_URL;

export default async function getServerAppData(): Promise<ServerAppData> {
    const provider = new JsonRpcProvider(NETWORK_CONFIG.soneium.rpcUrls.default.http[0]);
    const NeemoYieldAgentContract = await getReadContract('USDC', 'soneium', 'NeemoYieldAgent', provider);
    
    const [agentLogs, currentPosition] = await Promise.all([
        fetchAgentLogs(),
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

async function fetchAgentLogs(): Promise<AgentLog[]> {
    try {
        const res = await axios.get(API_URL + '/logs');
        return res.data as AgentLog[];
    } catch (error) {
        console.log('error getAgentLogs', error);
        return [];
    }
}