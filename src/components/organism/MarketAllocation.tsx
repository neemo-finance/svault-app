import { formatNumberHuman, getRandomNumberInRange } from "@/utils/common";
import TabbedCard from "../molecule/TabbedCard";

export default function MarketAllocation() {
    return (
        <TabbedCard
            tabs={[{ id: "marketAllocation", label: "Market Allocation" }]}
            activeTab="marketAllocation"
        >
            <table className="w-full min-w-lg">
                <thead>
                    <tr className="text-left text-xs text-zinc-400">
                        <th className="font-normal pb-2">Vault</th>
                        <th className="font-normal pb-2">Allocation</th>
                        <th className="font-normal pb-2">Available</th>
                        <th className="font-normal pb-2">Percentage</th>
                        <th className="font-normal pb-2 text-right">APY</th>
                    </tr>
                </thead>
                <tbody>
                    {vaults.map((vault, index) => (
                        <tr className="text-sm text-zinc-300" key={index}>
                            <td className="py-1">{vault}</td>
                            <td className="py-1">{formatNumberHuman(getRandomNumberInRange(1000, 10_000_000))} USDC</td>
                            <td className="py-1">{formatNumberHuman(getRandomNumberInRange(1000, 10_000_000))} USDC</td>
                            <td className="py-1">{getRandomNumberInRange(5, 25)}%</td>
                            <td className="py-1 text-right">{getRandomNumberInRange(5, 100)/10}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TabbedCard>
    );
}

const vaults = [
    'USDC - ezETH',
    'USDC - wstETH',
    'USDC - wETH',
    'USDC - weETH',
    'USDC - LBTC',
    'USDC - cbETH',
    'USDC - cbBTC',
]
