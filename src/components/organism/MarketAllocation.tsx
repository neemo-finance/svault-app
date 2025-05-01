import { formatNumberHuman, getRandomNumberInRange } from "@/utils/common";
import TabbedCard from "../molecule/TabbedCard";
import Image from "next/image";

export default function MarketAllocation() {
    return (
        <TabbedCard
            tabs={[{ id: "marketAllocation", label: "Market Allocation" }]}
            activeTab="marketAllocation"
        >
            <div className="grid gap-2">
                {pools.map((pool, key) => (
                    <div key={key} className="flex items-center gap-2">
                        <Image 
                            src={pool.icon}
                            alt={pool.name}
                            width={24}
                            height={24}
                        />
                        <span className="text-sm text-zinc-300">{pool.name}</span>
                    </div>

                ))}
            </div>
        </TabbedCard>
    );
}

const pools = [
    {
        name: 'Sake',
        icon: '/images/pools/Sake.svg',
    },
    {
        name: 'Untitled',
        icon: '/images/pools/UB.svg',
    },
]
