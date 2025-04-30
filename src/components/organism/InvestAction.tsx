import { Events, appDataAtom } from '@/components/provider/AppStateProvider';
import { useMemo } from 'react';
import { ButtonProps } from '../atom/Button';
import { TransactionAction } from '@/components/molecule/TransactionAction';
import { useAtomValue } from 'jotai';
import { NETWORK_CONFIG, TOKEN_CONFIG, VAULT_CONFIG } from '@/constants/web3config';
import useContractWrite from '@/hooks/contract/contractWrite';
import { Token } from '@/constants/types';

export const InvestAction = (props: InvestActionProps) => {
    const data = useAtomValue(appDataAtom);
    const Vault = VAULT_CONFIG[data.vault];
    const Network = NETWORK_CONFIG[Vault.mainnet._id];

    const {
        approveTokenSpend,
        deposit,
        withdraw,
    } = useContractWrite();

    const item = useMemo(() => {
        const userTokenData = data.depositTokens[props.token];
        const tokenConfig = TOKEN_CONFIG[Network._id][props.token];

        // Deposit
        if (props.event === Events.depositEvent) {
            if (!props.amount || props.amount <= 0n) {
                return {
                    text: 'Enter Amount',
                    isDisabled: true,
                };
            }

            if (!userTokenData || userTokenData.balance < props.amount) {
                return {
                    text: 'Exceeds balance',
                    isDisabled: true,
                };
            }

            if (userTokenData.allowance < props.amount) {
                return {
                    event: Events.tokenApprovalEvent,
                    handler: approveTokenSpend,
                    params: { token: props.token },
                    text: `Approve ${tokenConfig.symbol}`,
                    successMsg: 'Approval successful',
                    failedMsg: 'Approval failed',
                    isDisabled: false,
                    lockForm: true,
                    onSuccess: props.onSuccess,
                };
            }

            return {
                event: Events.depositEvent,
                handler: () => deposit,
                params: { token: props.token, amount: props.amount! },
                text: 'Deposit',
                successMsg: 'Deposited successfully',
                failedMsg: 'Deposit failed',
                isDisabled: false,
                lockForm: true,
                onSuccess: props.onSuccess,
            };
        }

        // Standard withdraw and Rebalance Add
        else if (props.event === Events.withdrawEvent) {
            if (!props.amount || props.amount <= 0n) {
                return {
                    text: 'Enter Amount',
                    isDisabled: true,
                };
            }

            if (data.userDeposit < props.amount) {
                return {
                    text: 'Exceeds balance',
                    isDisabled: true,
                };
            }

            return {
                event: props.event,
                handler: withdraw,
                params: { amount: props.amount! },
                text: 'Withdraw',
                successMsg: 'Withdraw successful',
                failedMsg: 'Withdraw failed',
                isDisabled: false,
                lockForm: true,
                onSuccess: props.onSuccess,
            };
        }

        return {
            text: 'Deposit',
            isDisabled: true,
        };
    }, [props, data.userDeposit, data.depositTokens]);

    return (
        <TransactionAction transaction={{ ...item }} targetNetwork={Network} buttonProps={props.buttonProps} />
    );
};

interface InvestActionProps {
    event: Events;
    amount?: bigint;
    token: Token;
    loadingText?: string;
    onSuccess?: (event: Events) => void;
    onTransactionSuccess?: () => void;
    buttonProps?: ButtonProps;
}
