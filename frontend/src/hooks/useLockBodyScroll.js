// hooks/useLockBodyScroll.js
import { useEffect } from "react";

export default function useLockBodyScroll(isLocked) {
    useEffect(() => {
        if (!isLocked) return;

        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, [isLocked]);
}