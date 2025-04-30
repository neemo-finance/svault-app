import { AgentLog } from "@/constants/types";
import axios from "axios";

const API_URL = "http://18.142.106.94:3001";

export async function getAgentLogs(): Promise<AgentLog[]> {
    try {
        const res = await axios.get(API_URL + '/logs');
        return res.data as AgentLog[];
    } catch (error) {
        console.log('error getAgentLogs', error);
        return [];
    }
}