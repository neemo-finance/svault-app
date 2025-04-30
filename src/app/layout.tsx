import type { Metadata } from "next";
import { Space_Grotesk, Source_Code_Pro } from "next/font/google";

import "./globals.css";

import WalletProvider from "@/components/provider/WalletProvider";
import JotaiProvider from "@/components/provider/JotaiProvider";
import AppStateProvider from "@/components/provider/AppStateProvider";
import Navbar from "@/components/app/Navbar";
import getServerAppData from "@/utils/ssr";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-default",
    subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
    variable: "--font-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "sVault",
    description: "sVault by Neemo Labs",
    icons: "/images/icon.svg"
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const appData = await getServerAppData();

    return (
        <html lang="en">
            <body
                className={`${spaceGrotesk.variable} ${sourceCodePro.variable} antialiased pt-[4.5rem] selection:bg-primary-600 selection:text-black`}
            >
                <WalletProvider>
                    <JotaiProvider>
                        <AppStateProvider serverData={appData}>
                            <Navbar />
                            {children}
                        </AppStateProvider>
                    </JotaiProvider>
                </WalletProvider>
            </body>
        </html>
    );
}