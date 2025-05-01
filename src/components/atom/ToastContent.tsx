import { ToastIcon } from "@/hooks/app/alerts";
import { toSentenceCase } from "@/utils/common";
import clsx from "clsx";
import {
    IoCheckmarkCircleOutline,
    IoCloseOutline,
    IoInformationCircleOutline,
    IoWarningOutline,
} from "react-icons/io5";
import { MdContentCopy, MdAttachMoney } from "react-icons/md";
import { TbTransactionBitcoin } from "react-icons/tb";

const Toast = ({ type, title, subtitle }: ToastProps) => {
    return (
        <div className="flex flex-col px-2 h-full text-zinc-200 text-sm">
            <span className="flex items-start gap-2 leading-4">
                {type === ToastIcon.Vault && (
                    <MdAttachMoney className="text-primary w-[1.15rem] h-[1.15rem]" />
                )}

                {type === ToastIcon.Error && (
                    <IoCloseOutline className="text-red-400 w-[1.15rem] h-[1.15rem]" />
                )}

                {type === ToastIcon.Info && (
                    <IoInformationCircleOutline className="w-[1.15rem] h-[1.15rem]" />
                )}

                {type === ToastIcon.Success && (
                    <IoCheckmarkCircleOutline className="w-[1.15rem] h-[1.15rem]" />
                )}

                {type === ToastIcon.Warning && (
                    <IoWarningOutline className="text-orange-400 w-[1.15rem] h-[1.15rem]" />
                )}

                {type === ToastIcon.Transaction && (
                    <TbTransactionBitcoin className="w-[1.15rem] h-[1.15rem]" />
                )}

                {type === ToastIcon.Copy && (
                    <MdContentCopy className="w-[1.15rem] h-[1.15rem]" />
                )}

                {toSentenceCase(title.toString())}
            </span>
            {subtitle && (
                <span className={clsx("text-zinc-200 text-xs", {
                    "pl-7": type !== ToastIcon.Loading
                })}>
                    {toSentenceCase(subtitle)}
                </span>
            )}
        </div>
    );
};

export default function ToastContent(
    type: ToastIcon,
    title: string,
    subtitle?: string
) {
    return <Toast type={type} title={title} subtitle={subtitle} />;
}

type ToastProps = {
    type: ToastIcon;
    title: string;
    subtitle?: string;
};
