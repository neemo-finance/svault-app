import { EthersError } from 'ethers';
import { DecodedError, ErrorDecoder } from 'ethers-decode-error';
import { toast } from 'react-toastify';
import { ToastIcon } from '@/hooks/app/alerts';
import ToastContent from '@/components/atom/ToastContent';

export interface ProviderRpcError extends Error {
    code: number;
    message: string;
    data?: unknown;
}

export interface ProviderRpcMessageData {
    value: {
        code: string;
        message: string;
    };
}

export const getErrorMessage = async (_error: EthersError) => {
    // if (_error?.shortMessage?.includes('custom')) {
    //     const abi = (await TOKEN_CONFIG.ASTAR.abi.shibuya_testnet!.DappStakingManagerL1!()).default;
    //     // @ts-expect-error Abi type mismatch
    //     const decodedError = await ErrorDecoder.create([abi]).decode(_error);
    //     return decodedError;
    // }
    return _error?.shortMessage ?? _error;
};

export const handleError =
    (isSilent = false) =>
    async (_error: EthersError) => {
        const error = await getErrorMessage(_error);
        if (!isSilent && error) {
            toast(ToastContent(ToastIcon.Error, error));
        }
    };

export const handleErrorSilent = handleError(true);
