import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

export default function Button({ children, onClick, disabled = undefined, isLoading, className, variant = "default", size = "block", ...props }: ButtonProps) {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            {...props}
            className={clsx(
                "flex items-center justify-center gap-3 px-3 py-2 rounded-lg font-medium cursor-pointer transition-colors",
                {
                    "bg-primary text-black hover:bg-primary-400": variant === "default",
                    "bg-zinc-900 hover:bg-zinc-800 text-zinc-300": variant === "wallet",
                }
            )}
        >
            {children}
        </button>
    )
}

export type ButtonProps = {
    children?: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean | undefined;
    variant?: "default" | "wallet";
    size?: "block" | "wallet";
    isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;