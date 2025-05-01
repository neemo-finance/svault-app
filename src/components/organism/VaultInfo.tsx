"use client";

import { useAtomValue } from "jotai";
import { appDataAtom } from "../provider/AppStateProvider";
import { TOKEN_CONFIG } from "@/constants/web3config";
import { formatUnits } from "ethers";
import { formatNumberHuman } from "@/utils/common";

export default function VaultInfo() {
    const appData = useAtomValue(appDataAtom);
    const token = TOKEN_CONFIG.soneium.USDC;

    return (
        <div>
            <h1 className="text-4xl font-medium">{appData.vault} Vault</h1>
            <p className="text-base text-zinc-200 tracking-wide mt-4">
                This vault manages liquidity on Soneium through multiple market
                making strategies, performs liquidations, and accrues platform
                fees.
            </p>

            <div className="flex gap-4 flex-wrap mt-8">
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4">
                    <p className="tracking-wide text-base">Vault Assets</p>
                    <p className="text-3xl font-medium">
                        $
                        {formatNumberHuman(
                            +formatUnits(
                                appData.currentPosition.totalAssets,
                                token.decimals
                            )
                        )}
                    </p>
                </div>
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4">
                    <p className="tracking-wide text-base">APY</p>
                    <p className="text-3xl font-medium text-primary">{formatUnits(appData.currentPosition.currentProtocolAPY, 2)}%</p>
                </div>
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4">
                    <p className="tracking-wide text-base">Your Deposit</p>
                    <p className="text-3xl font-medium">${formatNumberHuman(+formatUnits(appData.userDeposit.current))}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="tracking-wide text-base">Earned</p>
                    <p className="text-3xl font-medium text-primary">${formatNumberHuman(+formatUnits(appData.userDeposit.current - appData.userDeposit.deposit))}</p>
                </div>
            </div>
        </div>
    );
}
