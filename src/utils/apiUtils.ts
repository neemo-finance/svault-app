import { AgentLog } from "@/constants/types";
import axios from "axios";

export async function getAgentLogs(): Promise<AgentLog[]> {
    try {
        const res = await axios.get('/api/logs');
        return res.data as AgentLog[];
    } catch (error) {
        console.log('error getAgentLogs', error);
        return [];
    }
}