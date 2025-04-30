import InvestCard from "@/components/organism/InvestCard";
import LiveStatus from "@/components/organism/LiveStatus";
import MarketAllocation from "@/components/organism/MarketAllocation";
import VaultInfo from "@/components/organism/VaultInfo";

export default function Home() {
    return (
        <main className="max-w-page-content mx-auto my-8 flex flex-wrap md:flex-nowrap gap-4">
            <div className="flex flex-col gap-4 flex-wrap lg:mb-0">
                <VaultInfo />

                <div className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4 w-full mt-4">
                    <InvestCard />
                    <MarketAllocation />
                </div>
            </div>
            <LiveStatus />
        </main>
    );
}
