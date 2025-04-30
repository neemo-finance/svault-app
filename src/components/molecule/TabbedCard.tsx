"use client";
import { motion } from "motion/react";
import { useRef } from "react";

export default function TabbedCard({ tabs, activeTab, setActiveTab, children }: TabbedCardProps) {
    const indicatorId = useRef("tabIndicator" + Math.random().toString(36).substring(2, 15));

    return (
        <div className="flex flex-col bg-card-background rounded-2xl border border-white/10 max-w-full overflow-hidden">
            {/* Header */}
            <div className="w-full p-6 pb-2 border-b border-white/10 flex gap-4">
                {tabs.map((tab) => (
                    <button 
                        disabled={activeTab.toLowerCase() === tab.id.toLowerCase()}
                        className="text-base text-white/70 cursor-pointer disabled:text-white disabled:cursor-default transition-colors relative"
                        onClick={() => setActiveTab?.(tab.id)}
                        key={tab.id}
                    >
                        {(activeTab === tab.id) && (
                            <motion.span
                                layoutId={indicatorId.current}
                                className="absolute w-full h-px -bottom-[9px] z-10 bg-white"
                                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                            />
                        )}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto">
                {children}
            </div>
        </div>
    )
}

export type TabbedCardProps = {
    tabs: Tab[];
    activeTab: string;
    setActiveTab?: (tabId: string) => void;
    children?: React.ReactNode;
}

export type Tab = {
    label: string;
    id: string;
}



