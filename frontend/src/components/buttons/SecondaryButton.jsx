import { Link } from "react-router-dom";


export default function SecondaryButton({ 
    children, 
    to, 
    onclick, 
    type = "button",
    className = "",
    disabled
}) {

    const baseStyle = "box-border block text-sm font-semibold text-[#10B981] border-[3px] py-1 px-3 rounded-full flex items-center justify-center active:scale-[0.98]";
    
    if (to) {
        return (
            <Link disabled={disabled} to={to} className={`${baseStyle} ${className}`}>
                {children}
            </Link>
        )
    }


    return (
        <button
            type={type}
            onClick={onclick}
            disabled={disabled}
            className={`${baseStyle} ${className}`}    
        >
            {children}
        </button>
    )
}