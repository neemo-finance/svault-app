"use client";
import { useAtomValue } from "jotai";
import TabbedCard from "../molecule/TabbedCard";
import Image from "next/image";
import { appDataAtom } from "../provider/AppStateProvider";

export default function MarketAllocation() {
    const appData = useAtomValue(appDataAtom);

    return (
        <TabbedCard
            tabs={[{ id: "marketAllocation", label: "Market Allocation" }]}
            activeTab="marketAllocation"
        >
            <div className="grid gap-2">
                {pools.map((pool, key) => (
                    <div
                        key={key}
                        className="flex items-center justify-between gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <Image
                                src={pool.icon}
                                alt={pool.name}
                                width={24}
                                height={24}
                            />
                            <span className="text-sm text-zinc-300">
                                {pool.name}
                            </span>
                        </div>
                        {appData.currentPosition.currentProtocolId ===
                            pool.protocolId && <span className="leading-4 text-[10px] text-emerald-400 tracking-widest">SELECTED</span>
                        }
                    </div>
                ))}
            </div>
        </TabbedCard>
    );
}

const pools = [
    {
        name: "Sake",
        icon: "/images/pools/Sake.svg",
        protocolId: 1n,
    },
    {
        name: "Untitled",
        icon: "/images/pools/UB.svg",
        protocolId: 2n,
    },
];
