import { useState, useEffect } from "react";

export default function ToastMessage({ message, duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Trigger entrance animation on mount
    useEffect(() => {
        const enterTimer = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(enterTimer);
    }, []);

    // Start exit animation before actually unmounting
    useEffect(() => {
        const closeTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration);

        return () => clearTimeout(closeTimer);
    }, [duration]);

    // Once exit animation finishes, actually remove from parent state
    useEffect(() => {
        if (!isExiting) return;

        const removeTimer = setTimeout(() => {
            onClose();
        }, 300); // must match the CSS transition duration below

        return () => clearTimeout(removeTimer);
    }, [isExiting, onClose]);

    return (
        <div
            className={`fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg
                transition-all duration-300 ease-out
                ${isVisible && !isExiting
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"}`}
        >
            {message}
        </div>
    );
}