import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import { FaAngleDown } from "react-icons/fa6";
import { useClickAway } from "react-use";

export default function SelectInput({
    options,
    selectedValue,
    onChange,
}: SelectInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(
        (option) => option.value === selectedValue
    );

    function handleInputChange(value: string) {
        onChange?.(value);
        setIsOpen(false);
    }

    const dropdownRef = useRef(null);

    useClickAway(dropdownRef, () => {
        setIsOpen(false);
    })

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 bg-input-background border border-white/10 px-2 py-2 rounded-lg cursor-pointer"
            >
                {selectedOption?.icon && (
                    <Image
                        src={selectedOption.icon}
                        alt={selectedOption.label}
                        width={24}
                        height={24}
                    />
                )}

                <span className="flex-1">{selectedOption?.label}</span>

                <FaAngleDown className={clsx("w-4 h-4 transition-transform", {
                    "rotate-z-180": isOpen
                })} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="absolute top-full left-0 mt-2 w-full bg-input-background border border-white/10 p-1 rounded-lg flex flex-col gap-1"
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{
                            duration: 0.1,
                            ease: 'circInOut'
                        }}
                    >
                        {options.map((option) => (
                            <span
                                key={option.value}
                                className="hover:bg-zinc-800 p-1 rounded-sm flex items-center gap-2 transition-colors cursor-pointer select-none"
                                onClick={() => handleInputChange(option.value)}
                            >
                                {option.icon && (
                                    <Image
                                        src={option.icon}
                                        alt={option.label}
                                        width={24}
                                        height={24}
                                    />
                                )}
                                {option.label}
                            </span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export type SelectInputProps = {
    options: {
        label: string;
        value: string;
        icon?: string;
    }[];
    selectedValue: string;
    onChange: (value: string) => void;
};
