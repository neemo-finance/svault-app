import TabbedCard from "../molecule/TabbedCard";

export default function ChartCard() {
    return (
        <TabbedCard
            tabs={[{ label: "Chart", id: "chart" }]}
            activeTab="chart"
        ></TabbedCard>
    );
}
