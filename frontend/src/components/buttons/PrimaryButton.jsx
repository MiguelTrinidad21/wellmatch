import { Link } from "react-router-dom";


export default function PrimaryButton({ 
    children,
    to,
    onClick,
    type = "button",
    className,
    disabled
 }) {

    const baseStyle = "box-border block text-center text-md text-white font-semibold bg-[#10B981] py-2 px-3 rounded-full active:scale-[0.98]";

    if (to) {
        return (
            <Link to={to} className={`${baseStyle} ${className}`}>
                {children}
            </Link>
        )
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${className}`}    
        >
            {children}
        </button>
    )
}