import { Chain } from "@reown/appkit/networks";
import { InterfaceAbi } from "ethers";

export type Vault = "USDC";

export type Network = "soneium";

export type ContractType = "NeemoYieldAgent";

export type Token = 'USDC' | 'USDT';

export type ContractRecord<T> = {
    [N in Network]?: {
        [C in ContractType]?: T;
    };
};

export type TokenRecord = {
    [N in Network]?: Token[];
};

export type TokenConfig = {
    [N in Network]: {
        [T in Token]: {
            _id: T;
            name: string;
            symbol: string;
            address: string;
            decimals: number;
            icon: string;
        }
    }
};

export type NetworkConfig = {
    [N in Network]: {
        _id: N;
        faucet?: string;
    } & Chain;
};

export type VaultConfig = {
    [V in Vault]: {
        _id: V;
        name: string;
        mainnet: NetworkConfig[Network];
        abi: ContractRecord<() => Promise<{ default: InterfaceAbi }>>;
        contract: ContractRecord<string>;
        vaultToken: Token;
        depositTokens: TokenRecord;
    };
};

export type AgentLog = {
    timestamp: number;
    log_entry: string;
    readable_log_entry: string;
    tag: string;
};
