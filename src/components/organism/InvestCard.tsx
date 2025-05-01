"use client";
import { useRef, useState } from "react";
import TabbedCard from "../molecule/TabbedCard";
import UnitInput, { UnitInputRef } from "../molecule/UnitInput";
import SelectInput from "../molecule/SelectInput";
import { useAtomValue } from "jotai";
import { appDataAtom, Events } from "../provider/AppStateProvider";
import { TOKEN_CONFIG, VAULT_CONFIG } from "@/constants/web3config";
import { Token } from "@/constants/types";
import { InvestAction } from "./InvestAction";
import Image from "next/image";

export default function InvestCard() {
    const appData = useAtomValue(appDataAtom);

    const vault = VAULT_CONFIG[appData.vault];
    const tokenConfig = TOKEN_CONFIG.soneium;

    const depositTokens = vault.depositTokens.soneium!;

    const unitInputRef = useRef<UnitInputRef>(null);

    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
    const [selectedToken, setSelectedToken] = useState<Token>(depositTokens[0]);
    const [amount, setAmount] = useState<bigint>(0n);

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
                {/* <p className="text-sm leading-5 text-zinc-400">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor
                </p> */}

                {activeTab === "deposit" ?
                    <SelectInput
                        options={depositTokens.map((token) => ({
                            label: tokenConfig[token].symbol,
                            value: tokenConfig[token]._id,
                            icon: tokenConfig[token].icon,
                        }))}
                        selectedValue={selectedToken}
                        onChange={(value) => setSelectedToken(value as Token)}
                    /> :
                    <div className="flex items-center gap-2 bg-input-background border border-white/10 px-2 py-2 rounded-lg">
                        <Image 
                            src={tokenConfig[vault.vaultToken].icon}
                            alt={tokenConfig[vault.vaultToken].symbol}
                            width={24}
                            height={24}
                        />
                        <span>{tokenConfig[vault.vaultToken].symbol}</span>
                    </div>
                }

                <UnitInput
                    decimals={tokenConfig[selectedToken].decimals}
                    balance={(activeTab === "deposit" ? appData.depositTokens[selectedToken]?.balance : appData.userDeposit.current) || 0n}
                    onInputUpdate={setAmount}
                    ref={unitInputRef}
                />

                <InvestAction 
                    event={activeTab === "deposit" ? Events.depositEvent : Events.withdrawEvent}
                    amount={amount}
                    token={selectedToken}
                    onSuccess={(event) => {
                        if (event === "tokenApprovalEvent") return;
                        setAmount(0n);
                        unitInputRef.current?.clear()
                    }}
                />
            </div>
        </TabbedCard>
    );
}
