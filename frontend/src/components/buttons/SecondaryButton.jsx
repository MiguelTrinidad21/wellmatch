import { Link } from "react-router-dom";


export default function SecondaryButton({ 
    children, 
    to, 
    onclick, 
    type = "button",
    className = ""
}) {

    const baseStyle = "text-sm text-[#10B981] outline-[3px] py-1 px-3 rounded-full flex items-center justify-center active:scale-[0.98]";
    
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
            onClick={onclick}
            className={`${baseStyle} ${className}`}    
        >
            {children}
        </button>
    )
}