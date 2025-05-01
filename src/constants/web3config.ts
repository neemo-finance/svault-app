import { soneium } from '@reown/appkit/networks';
import { NetworkConfig, TokenConfig, VaultConfig } from './types';

const NeemoYieldAgentAbi = () => import('./abi/NeemoYieldAgent.abi.json');
export const ERC20Abi = () => import('./abi/ERC20Abi.json');

export const TOKEN_CONFIG: TokenConfig = {
    soneium: {
        USDC: {
            _id: 'USDC',
            address: '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
            decimals: 6,
            icon: '/images/tokens/USDC.svg',
            name: 'Bridged USDC',
            symbol: 'USDC.e'
        },
        USDT: {
            _id: 'USDT',
            address: '0x3A337a6adA9d885b6Ad95ec48F9b75f197b5AE35',
            decimals: 6,
            icon: '/images/tokens/USDT.svg',
            name: 'Tether USD',
            symbol: 'USDT'
        }
    }
}

export const NETWORK_CONFIG: NetworkConfig = {
    soneium: {
        ...soneium,
        _id: 'soneium',
        rpcUrls: {
            default: {
                http: ['https://soneium.rpc.scs.startale.com?apikey=1MMV6OevV2VYFcEunLEXOIZEDwkUxdl3']
            }
        }
    },
}

export const VAULT_CONFIG: VaultConfig = {
    USDC: {
        _id: 'USDC',
        name: 'USDC',
        vaultToken: 'USDC',
        mainnet: NETWORK_CONFIG.soneium,
        contract: {
            soneium: {
                NeemoYieldAgent: "0x866a5c73ffC38f7fCFc1bdfA3536c8C880c9aEFe",
            },
        },
        abi: {
            soneium: {
                NeemoYieldAgent: NeemoYieldAgentAbi,
            }
        },
        depositTokens: {
            soneium: ['USDC', 'USDT']
        },
    }
}