import Image from "next/image";
import WalletButton from "./WalletButton";

export default function Navbar() {
    return (
        <nav className="fixed inset-0 h-fit flex items-center justify-between md:px-6 px-[5vw] py-4 backdrop-blur-md z-30">
            <Image 
                src={'/images/logo.svg'}
                height={32}
                width={160}
                alt="SVAULT"
            />

            <div>
                <WalletButton />
            </div>
        </nav>
    )
}