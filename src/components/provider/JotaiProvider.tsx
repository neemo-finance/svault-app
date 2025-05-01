"use client";
import { Provider } from "jotai";
import { ToastContainer } from "react-toastify";

export default function JotaiProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Provider>
            {children}
            <ToastContainer
                position="bottom-right"
                pauseOnHover={false}
                pauseOnFocusLoss={false}
                draggable={false}
                autoClose={5000}
                closeButton={false}
                hideProgressBar={true}
                newestOnTop={true}
                toastClassName={(context) => context?.defaultClassName + " !p-0 border border-white/10"}
            />
        </Provider>
    );
}
