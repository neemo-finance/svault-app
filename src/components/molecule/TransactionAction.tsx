import Button, { ButtonProps } from '@/components/atom/Button';
import { NETWORK_CONFIG } from '@/constants/web3config';
import { getPendingTransactions, useTransactions } from '@/hooks/contract/transactions';
import { Events, appTransactionsAtom } from '@/components/provider/AppStateProvider';
import { FC, useEffect, useMemo, useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useAtomValue } from 'jotai';
import { Chain } from '@reown/appkit/networks';

export const TransactionAction: FC<TransactionActionProps> = (props) => {
    const [state, setState] = useState({
        processing: false,
        txHash: '',
        uniqueId: undefined as string | undefined, //Gets init when a txn is triggered and reset when the txn is completed
    });
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { chainId, switchNetwork } = useAppKitNetwork();
    const { pushTx } = useTransactions();
    const transactions = useAtomValue(appTransactionsAtom);
    const pendingTx = getPendingTransactions(address, chainId, transactions);
    const networkConfig = NETWORK_CONFIG.soneium;

    // Listens to the unique id of the transaction and if it's not found in the pending transactions
    // it means that the transaction was completed and the button spinner should be stopped
    // Bypass the txSuccess check
    useEffect(() => {
        if (!state.uniqueId || pendingTx.length === 0 || !state.processing) {
            return;
        }
        const tx = pendingTx.find((x) => x.uniqueId == state.uniqueId);
        if (!tx) {
            setState((previous) => ({ ...previous, processing: false }));
        }
    }, [pendingTx, state.uniqueId]);

    const handleTransaction = async (params: TransactionParams) => {
        setState((previous) => ({
            ...previous,
            processing: true,
            uniqueId: params.uniqueId,
            phaseId: (params.params as any)?.phaseId,
        }));
        if (!params.validation || (await params.validation())) {
            const tx = params.handler ? await params.handler(params.params) : null;
            if (!!tx) {
                // Push transaction and stop button spinner
                pushTx({
                  hash: tx.hash,
                  chainId: chainId!,
                  address: address!,
                  successMsg: params.successMsg,
                  failedMsg: params.failedMsg,
                  event: params.event!,
                  uniqueId: params.uniqueId,
                  onSuccess: params.onTransactionSuccess,
                });

                setState((previous) => ({
                    ...previous,
                    processing: !!params.lockForm,
                    txHash: tx.hash,
                }));

                params.onSuccess && params.onSuccess(params.event!);
            }
        }
        setState((previous) => ({
            ...previous,
            processing: false,
            uniqueId: undefined,
        }));
    };

    const item = useMemo(() => {
        let text = props.transaction.text;
        let handleClick = async () => await handleTransaction(props.transaction);
        let isDisabled = props.transaction.isDisabled || props.buttonProps?.disabled;

        // Connect Wallet
        if (!address) {
            text = 'Connect Wallet';
            handleClick = async () => open();
            isDisabled = false;
        }

        // Switch Network
        if (!!address && props.targetNetwork && props.targetNetwork.id != chainId) {
            text = `Switch to ${props.targetNetwork.name}`;
            handleClick = async () => {
                switchNetwork && (await switchNetwork(props.targetNetwork));
            };
            isDisabled = false;
        }
        return {
            text,
            handleClick,
            isDisabled,
        };
    }, [
        props.transaction.params,
        props.transaction.event,
        props.transaction.text,
        props.transaction.isDisabled,
        props.buttonProps,
        props.targetNetwork,
        address,
        chainId,
    ]);

    const isActiveTransaction = useMemo(() => {
        if (pendingTx.length > 0) {
            return pendingTx.find((txn) => txn.chainId === networkConfig.id)?.event; // Only block UI on same network
        } else {
            return false;
        }
    }, [pendingTx, networkConfig.id]);

    return (
      <>
        <Button
          size="block"
          onClick={() => {
            item.handleClick();
          }}
          isLoading={state.processing || (isActiveTransaction === props.transaction.event)}
          {...props.buttonProps}
          disabled={item.isDisabled || state.processing || isActiveTransaction !== false}
        >
          {(state.processing || (isActiveTransaction === props.transaction.event)) ? "" : item.text}
  
          {(state.processing || (isActiveTransaction === props.transaction.event)) && (props.transaction.loadingText || "Processing")}
          
          {!(state.processing || (isActiveTransaction === props.transaction.event)) && props.buttonProps?.children}
        </Button>
      </>
    );
};

export type TransactionParams = {
    text: string;
    event?: Events;
    handler?: CallableFunction;
    validation?: CallableFunction;
    onSuccess?: (event: Events) => void;
    isDisabled?: boolean;
    params?: {};
    lockForm?: boolean;
    successMsg?: string;
    failedMsg?: string;
    uniqueId?: string;
    loadingText?: string;  
    onTransactionSuccess?: () => void;
};

type TransactionActionProps = {
    transaction: TransactionParams;
    targetNetwork: Chain;
    buttonProps?: ButtonProps;
};
