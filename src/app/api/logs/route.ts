import { NextResponse } from 'next/server';
import axios from 'axios';
import { AgentLog } from '@/constants/types';

const API_URL = process.env.API_URL;

async function fetchAgentLogs(): Promise<AgentLog[]> {
    try {
        const res = await axios.get(API_URL + '/logs');
        return res.data as AgentLog[];
    } catch (error) {
        console.log('error getAgentLogs', error);
        return [];
    }
}

export async function GET() {
    const data = await fetchAgentLogs();
    return NextResponse.json(data);
}