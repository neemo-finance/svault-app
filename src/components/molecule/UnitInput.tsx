import { formatNumberHuman, isAllowedNumber, isValidNumberKeypress } from '@/utils/common';
import { BigNumberish, FixedNumber, formatEther, parseEther } from 'ethers';
import {
    ChangeEventHandler,
    KeyboardEventHandler,
    Ref,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import { ensuredForwardRef } from 'react-use';

const UnitInput = ensuredForwardRef<UnitInputRef, UnitInputProps>(
    (
        {
            variant = "primary",
            balance,
            value,
            onInputUpdate,
            onChangeFn,
        }: UnitInputProps,
        ref: Ref<unknown> | undefined,
    ) => {
        const inputEl = useRef<HTMLInputElement>(null);

        useImperativeHandle(ref, () => ({
            clear: () => {
                inputEl.current !== null && (inputEl.current.value = '');
            },
            setValue: (val: BigNumberish, precision?: number) => {
                // Not implemented yet
            },
            focus: () => {
                inputEl.current!.focus();
            },
        }));

        const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
            let value = e.target!.value;
            if (!isAllowedNumber(value)) {
                return;
            }
            const emitValue = +value === 0 ? (0 as BigNumberish) : parseEther(value);
            onInputUpdate && onInputUpdate(emitValue);
            onChangeFn && onChangeFn(emitValue);
        };

        const restrictE: KeyboardEventHandler<HTMLInputElement> = (e) => {
            let value = inputEl.current!.value;
            const decimalIndex = value.indexOf('.');
            if (decimalIndex !== -1 && value.substring(decimalIndex + 1).length > 10) {
                e.preventDefault();
            }
            if (!isValidNumberKeypress(e.key)) {
                e.preventDefault();
            }
        };

        // const handleMaxClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        //     e.stopPropagation();
        //     let adjustedBalance =
        //         toAdjustForGas && !FixedNumber.fromValue(balance, 18).isZero()
        //             ? subtractBigNumbersEther(balance, gasEstimate ? gasEstimate : parseEther(MaxInputAdjustment))
        //             : balance;
        //     if (isBigNumberLessThan(adjustedBalance, 0)) adjustedBalance = 0;
        //     onInputUpdate && onInputUpdate(adjustedBalance);
        //     inputEl.current!.value = formatNumberInput(+formatEther(adjustedBalance)) as string;

        //     onChangeFn && onChangeFn(adjustedBalance);
        // };

        useEffect(() => {
            if (!value || !inputEl.current || FixedNumber.fromValue(value, 18).eq(FixedNumber.fromValue(0))) {
                if (inputEl.current) {
                    inputEl.current.value = '';
                }
                return;
            }
            inputEl.current.value = Number((+formatEther(value)).toFixed(InputPrecision)).toString();
        }, [value, inputEl]);

        return (
            <div className="flex flex-col gap-2">
                <div className='flex items-center justify-between'>
                    <span className='text-xs'>Available Balance</span>
                    <span className='text-xs'>{formatNumberHuman(+balance.toString())}</span>
                </div>
                <div className="flex items-center justify-between bg-input-background border border-white/10 px-2 py-2 rounded-lg">
                    <input
                        disabled={variant === 'secondary' || variant === 'display'}
                        ref={inputEl}
                        type="number"
                        className="placeholder:text-zinc-400 outline-none border-none bg-transparent flex-1"
                        placeholder="0.00"
                        onKeyPress={restrictE}
                        onChange={handleInputChange}
                        min={0}
                    ></input>
                    <button className='text-xs text-green-500 cursor-pointer'>MAX</button>
                </div>
            </div>
        );
        
    },
);

export default UnitInput;

export interface UnitInputProps {
    variant?: 'primary' | 'secondary' | 'display';
    balance: BigNumberish;
    value?: BigNumberish;
    onInputUpdate?: (num: BigNumberish) => void;
    onChangeFn?: (value?: BigNumberish) => void;
}

export type UnitInputRef = {
    clear: () => void;
    setValue: (val: BigNumberish, precision?: number) => void;
    focus: () => void;
};

const InputPrecision = 5;
const MaxInputAdjustment = '0.01';
