import { ContractType, Network, Token, Vault } from "@/constants/types";
import { ERC20Abi, TOKEN_CONFIG, VAULT_CONFIG } from "@/constants/web3config";
import { BrowserProvider, Contract, Eip1193Provider, JsonRpcProvider } from "ethers";

export const getContract = async (
    vault: Vault,
    network: Network,
    contractName: ContractType,
    provider: Eip1193Provider | undefined,
) => {
    if (!provider) return;
    try {
        const ethersProvider = new BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const abi = (await VAULT_CONFIG[vault].abi[network]![contractName]!()).default;
        const address = VAULT_CONFIG[vault].contract[network]![contractName]!;
        const contract = new Contract(address, abi, signer);
        return contract;
    } catch (e) {
        return null;
    }
};

export const getDepositTokenContract = async (
    depositToken: Token,
    network: Network,
    provider: Eip1193Provider | undefined,
) => {
    if (!provider) return;
    try {
        const ethersProvider = new BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const abi = (await ERC20Abi()).default;
        const address = TOKEN_CONFIG[network]![depositToken].address;
        const contract = new Contract(address, abi, signer);
        return contract;
    } catch {
        return null;
    }
};

export const getReadContract = async (
    vault: Vault,
    network: Network,
    contractName: ContractType,
    provider: JsonRpcProvider | BrowserProvider | undefined,
) => {
    if (!provider) return;
    try {
        const abi = (await VAULT_CONFIG[vault].abi[network]![contractName]!()).default;
        const address = VAULT_CONFIG[vault].contract[network]![contractName]!;
        const contract = new Contract(address, abi, provider);
        return contract;
    } catch {
        return null;
    }
};

export const getTokenReadContract = async (
    depositToken: Token,
    network: Network,
    provider: JsonRpcProvider | BrowserProvider | undefined,
) => {
    if (!provider) return;
    try {
        const abi = (await ERC20Abi()).default;
        const address = TOKEN_CONFIG[network][depositToken].address;
        const contract = new Contract(address, abi, provider);
        return contract;
    } catch {
        return null;
    }
};