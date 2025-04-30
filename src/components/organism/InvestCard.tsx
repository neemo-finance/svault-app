"use client";
import { useState } from "react";
import TabbedCard from "../molecule/TabbedCard";
import Button from "../atom/Button";
import UnitInput from "../molecule/UnitInput";
import SelectInput from "../molecule/SelectInput";
import { useAtomValue } from "jotai";
import { appDataAtom } from "../provider/AppStateProvider";
import { TOKEN_CONFIG, VAULT_CONFIG } from "@/constants/web3config";
import { Token } from "@/constants/types";
import { formatUnits } from "ethers";
import { formatNumberHuman } from "@/utils/common";

export default function InvestCard() {
    const appData = useAtomValue(appDataAtom);

    const vault = VAULT_CONFIG[appData.vault];
    const tokenConfig = TOKEN_CONFIG.soneium;

    const depositTokens = vault.depositTokens.soneium!;

    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(
        "deposit"
    );
    const [selectedToken, setSelectedToken] = useState<Token>(depositTokens[0]);

    return (
        <TabbedCard
            tabs={[
                {
                    label: "Deposit",
                    id: "deposit",
                },
                {
                    label: "Withdraw",
                    id: "withdraw",
                },
            ]}
            activeTab={activeTab || "deposit"}
            setActiveTab={(tabId) =>
                setActiveTab(tabId as "deposit" | "withdraw")
            }
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm leading-5 text-zinc-400">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor
                </p>

                <SelectInput
                    options={depositTokens.map((token) => ({
                        label: tokenConfig[token].symbol,
                        value: tokenConfig[token]._id,
                        icon: tokenConfig[token].icon,
                    }))}
                    selectedValue={selectedToken}
                    onChange={(value) => setSelectedToken(value as Token)}
                />

                <UnitInput
                    balance={formatNumberHuman(
                        +formatUnits(
                            appData.depositTokens[selectedToken]?.balance || 0n,
                            tokenConfig[selectedToken].decimals
                        )
                    )}
                />

                <Button>
                    {activeTab === "deposit" ? "Deposit" : "Withdraw"}
                </Button>
            </div>
        </TabbedCard>
    );
}
